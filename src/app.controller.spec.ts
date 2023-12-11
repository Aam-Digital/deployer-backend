import { AppController } from './app.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DeploymentInfo } from './deployment-info.dto';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';

describe('AppController', () => {
  let controller: AppController;
  let mockHttp: { post: jest.Mock };
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

  it('should write arguments to file', async () => {
    const mockWs = { write: jest.fn(), close: jest.fn() };
    jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWs as any);

    await firstValueFrom(controller.deployApp(deploymentData));

    expect(mockWs.write).toHaveBeenCalledWith(
      'test-name de test@mail.com test-username test-base y n',
    );
    expect(mockWs.close).toHaveBeenCalled();
  });

  it('should use the default locale if empty or omitted', async () => {
    const mockWs = { write: jest.fn(), close: jest.fn() };
    jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWs as any);

    const withoutLocale = { ...deploymentData, locale: '' };
    await firstValueFrom(controller.deployApp(withoutLocale));
    expect(mockWs.write).toHaveBeenCalledWith(
      'test-name en test@mail.com test-username test-base y n',
    );

    mockWs.write.mockReset();
    delete withoutLocale.locale;
    await firstValueFrom(controller.deployApp(withoutLocale));
    expect(mockWs.write).toHaveBeenCalledWith(
      'test-name en test@mail.com test-username test-base y n',
    );
  });
});
