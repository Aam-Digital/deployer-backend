import { AppController } from './app.controller';
import { Test, TestingModule } from '@nestjs/testing';
import {
  firstValueFrom,
  lastValueFrom,
  of,
  Subject,
  Subscription,
  throwError,
} from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DeploymentInfo } from './deployment-info.dto';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';

let onSubscription: Subscription;
let lines: Subject<string>;
jest.mock('tail', () => {
  // Mock Tail constructor
  return {
    Tail: jest.fn().mockReturnValue({
      on: (event, callback) => (onSubscription = lines.subscribe(callback)),
      unwatch: () => {
        console.log('subscription', onSubscription);
        onSubscription.unsubscribe();
      },
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
    queryBackend: true,
    monitor: false,
    sentry: false,
  };

  beforeEach(async () => {
    lines = new Subject();
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

  it('should throw bad request exception if name has wrong format', async () => {
    passDeployment();
    function testName(name: string) {
      return lastValueFrom(controller.deployApp({ ...deploymentData, name }));
    }
    await expect(testName('with space')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(testName('withCapital')).resolves.toBeTruthy();
    await expect(testName('withSymbol?')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(testName('withNumber123')).resolves.toBeTruthy();
    await expect(testName('with-dash')).resolves.toBeTruthy();
    await expect(testName('with_underscore')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  function passDeployment() {
    // automatically finish deployment
    jest.spyOn(lines, 'subscribe').mockImplementation((fn) => {
      setTimeout(() => fn('DONE'));
      return { unsubscribe: () => undefined } as any;
    });
  }

  it('should throw bad request exception if username has wrong format', async () => {
    passDeployment();
    function testName(username: string) {
      return lastValueFrom(
        controller.deployApp({ ...deploymentData, username }),
      );
    }

    await expect(testName('with space')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(testName('withCapital')).resolves.toBeTruthy();
    await expect(testName('withSymbol?')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(testName('withNumber123')).resolves.toBeTruthy();
    await expect(testName('with-dash')).resolves.toBeTruthy();
    await expect(testName('with_underscore')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw bad request exception if email has wrong format', async () => {
    passDeployment();
    function testMail(email: string) {
      return lastValueFrom(controller.deployApp({ ...deploymentData, email }));
    }

    await expect(testMail('testmail')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(testMail('test@mail')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(testMail('Test@mail@mail.de')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(testMail('Test@mail.com')).resolves.toBeTruthy();
    await expect(testMail('test.1@mail.com')).resolves.toBeTruthy();
    await expect(testMail('test_1@mail.com')).resolves.toBeTruthy();
    await expect(testMail('test-1@mail.com')).resolves.toBeTruthy();
    await expect(testMail('test-1@mail.co.uk')).resolves.toBeTruthy();
  });

  it('should throw error if ERROR is written to log', async () => {
    const res = firstValueFrom(controller.deployApp(deploymentData));
    lines.next('some logs');
    lines.next('ERROR my custom error');

    try {
      await res;
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toBe('my custom error');
      // Ensure tail is properly "unwatched"
      expect(onSubscription.closed).toBeTruthy();
      return;
    }

    throw new Error('No error thrown');
  });

  it('should write arguments to file', () => {
    const res = firstValueFrom(controller.deployApp(deploymentData));

    lines.next('DONE');

    expect(res).resolves.toBeTruthy();
    expect(mockWs.write).toHaveBeenCalledWith(
      'test-name test-base de test@mail.com test-username y y n n\n',
    );
    expect(mockWs.close).toHaveBeenCalled();
    // Ensure tail is properly "unwatched"
    expect(onSubscription.closed).toBeTruthy();
  });

  it('should use the default locale if empty', (done) => {
    const emptyLocale = { ...deploymentData, locale: '' };
    controller.deployApp(emptyLocale).subscribe(() => {
      expect(mockWs.write).toHaveBeenCalledWith(
        'test-name test-base en test@mail.com test-username y y n n\n',
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
        'test-name test-base en test@mail.com test-username y y n n\n',
      );
      done();
    });

    lines.next('DONE');
  });
});
