import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { DeploymentInfo } from './deployment-info.dto';
import * as fs from 'fs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, map } from 'rxjs';

@Controller()
export class AppController {
  private keycloakUrl = this.configService.get('KEYCLOAK_URL');
  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}
  @Post('deploy')
  deployApp(@Body() deploymentInfo: DeploymentInfo) {
    const data = new URLSearchParams();
    data.set('grant_type', 'client_credentials');
    data.set('client_id', deploymentInfo.client);
    data.set('client_secret', deploymentInfo.clientKey);
    return this.http
      .post(
        `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`,
        data,
      )
      .pipe(
        catchError((err) => {
          if (err?.status !== HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedException();
          }
          throw err;
        }),
        map(() => this.writeCommandsToPipe(deploymentInfo)),
      );
  }

  private writeCommandsToPipe(deploymentInfo: DeploymentInfo) {
    console.log('info', deploymentInfo);

    if (
      Object.values(deploymentInfo).some((val) => val.toString().includes(' '))
    ) {
      throw new BadRequestException('No spaces allowed in arguments');
    }

    const args = `${deploymentInfo.name} ${deploymentInfo.email} ${
      deploymentInfo.username
    } ${deploymentInfo.base} ${deploymentInfo.backend ? 'y' : 'n'} ${
      deploymentInfo.monitor ? 'y' : 'n'
    }`;
    console.log('args', args);
    const ws = fs.createWriteStream('dist/assets/arg-pipe');
    ws.write(args);
    ws.close();
    return { ok: true };
  }
}
