import { AppController } from './app.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { of, Subject, Subscription, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DeploymentInfo } from './deployment-info.dto';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';

let onSubscription: Subscription;
const lines = new Subject<string>();
jest.mock('tail', () => {
  // Mock Tail constructor
  return {
    Tail: jest.fn().mockReturnValue({
      on: (event, callback) => (onSubscription = lines.subscribe(callback)),
      unwatch: () => onSubscription.unsubscribe(),
    }),
  };
});

describe('AppController', () => {
  let controller: AppController;
  let mockHttp: { post: jest.Mock };
  let mockWs: { write: jest.Mock; close: jest.Mock };

  const deploymentData: DeploymentInfo = {
    name: 'test-name',
    locale: 'de',
    username: 'test-username',
    email: 'test@mail.com',
    client: 'test-client',
    clientKey: 'test-key',
    base: 'test-base',
    backend: true,
    monitor: false,
  };

  beforeEach(async () => {
    mockWs = { write: jest.fn(), close: jest.fn() };
    jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWs as any);
    mockHttp = {
      post: jest.fn().mockReturnValue(of({ data: undefined })),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AppController, { provide: HttpService, useValue: mockHttp }],
    }).compile();

    controller = module.get(AppController);
  });

  it('should create', () => {
    expect(controller).toBeDefined();
  });

  it('should throw unauthorized exception if access token could not be retrieved', (done) => {
    mockHttp.post.mockReturnValue(
      throwError(() => new UnauthorizedException()),
    );

    controller.deployApp(deploymentData).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(UnauthorizedException);
        done();
      },
    });
  });

  it('should throw bad request exception if data has wrong format', (done) => {
    const invalidData = { ...deploymentData, name: 'with space' };
    // TODO: add an extensive list of invalid formats including attempts someone could pass to try and inject code?

    controller.deployApp(invalidData).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(BadRequestException);
        done();
      },
    });
  });

  it('should throw error if ERROR is written to log', (done) => {
    controller.deployApp(deploymentData).subscribe({
      error: (err: BadRequestException) => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toBe('my custom error');
        // Ensure tail is properly "unwatched"
        expect(onSubscription.closed).toBeTruthy();
        done();
      },
    });

    lines.next('some logs');
    lines.next('ERROR my custom error');
  });

  it('should write arguments to file', (done) => {
    controller.deployApp(deploymentData).subscribe(() => {
      expect(mockWs.write).toHaveBeenCalledWith(
        'test-name de test@mail.com test-username test-base y n',
      );
      expect(mockWs.close).toHaveBeenCalled();
      // Ensure tail is properly "unwatched"
      expect(onSubscription.closed).toBeTruthy();
      done();
    });

    lines.next('DONE');
  });

  it('should use the default locale if empty', (done) => {
    const emptyLocale = { ...deploymentData, locale: '' };
    controller.deployApp(emptyLocale).subscribe(() => {
      expect(mockWs.write).toHaveBeenCalledWith(
        'test-name en test@mail.com test-username test-base y n',
      );
      done();
    });

    lines.next('DONE');
  });

  it('should use the default locale if omitted', (done) => {
    const noLocale = { ...deploymentData };
    delete noLocale.locale;
    controller.deployApp(noLocale).subscribe(() => {
      expect(mockWs.write).toHaveBeenCalledWith(
        'test-name en test@mail.com test-username test-base y n',
      );
      done();
    });

    lines.next('DONE');
  });
});
