import { Body, Controller, Post } from '@nestjs/common';
import { DeploymentInfo } from './deployment-info.dto';
import * as fs from 'fs';

@Controller()
export class AppController {
  @Post('deploy')
  deployApp(@Body() deploymentInfo: DeploymentInfo) {
    console.log('info', deploymentInfo);
    const args = `${deploymentInfo.name} ${
      deploymentInfo.backend ? 'y' : 'n'
    } ${deploymentInfo.monitor ? 'y' : 'n'}`;
    console.log('args', args);
    const ws = fs.createWriteStream('dist/assets/arg-pipe');
    ws.write(args);
    ws.close();
  }
}
