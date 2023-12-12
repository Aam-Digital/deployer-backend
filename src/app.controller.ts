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
import { catchError, mergeMap, Observable, Subject } from 'rxjs';
import { Tail } from 'tail';

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
        mergeMap(() => this.writeCommandsToPipe(deploymentInfo)),
      );
  }

  private writeCommandsToPipe(deploymentInfo: DeploymentInfo): Observable<any> {
    console.log('info', deploymentInfo);

    if (
      Object.values(deploymentInfo).some((val) => val.toString().includes(' '))
    ) {
      throw new BadRequestException('No spaces allowed in arguments');
    }

    const args = `${deploymentInfo.name} ${deploymentInfo.locale || 'en'} ${
      deploymentInfo.email
    } ${deploymentInfo.username} ${deploymentInfo.base} ${
      deploymentInfo.backend ? 'y' : 'n'
    } ${deploymentInfo.monitor ? 'y' : 'n'}`;
    console.log('args', args);
    const ws = fs.createWriteStream('dist/assets/arg-pipe');
    ws.write(args);
    ws.close();
    return this.getResult();
  }

  private getResult() {
    const result = new Subject();
    const tail = new Tail('dist/assets/log.txt');
    tail.on('line', (line: string) => {
      if (line.startsWith('ERROR')) {
        // Error found, text after error is returned
        const message = line.replace('ERROR ', '');
        tail.unwatch();
        result.error(new BadRequestException(message));
        result.complete();
      } else if (line.startsWith('DONE')) {
        // Success, app is deployed
        tail.unwatch();
        result.next({ ok: true });
        result.complete();
      }
    });

    return result.asObservable();
  }
}
