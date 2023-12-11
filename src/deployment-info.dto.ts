import { ApiProperty } from '@nestjs/swagger';

export class DeploymentInfo {
  @ApiProperty({
    description:
      'Name of the system to be created. Must not contain whitespaces.',
  })
  name: string;

  @ApiProperty({
    description: 'Language for the system (and keycloak).',
  })
  locale?: string;

  @ApiProperty({
    description: 'Username of the initial user account created as site admin.',
  })
  username: string;

  @ApiProperty({
    description: 'Email for the initial user account.',
  })
  email: string;

  @ApiProperty({
    description:
      'Whether the permission backend (replication-backend) should be set up.',
  })
  backend: boolean;

  @ApiProperty({
    description: 'Whether the new system should be added to uptime monitoring.',
  })
  monitor: boolean;

  @ApiProperty({
    description: 'Name of the Keycloak confidential client.',
  })
  client: string;

  @ApiProperty({
    description: 'Credentials for the Keycloak confidential client.',
  })
  clientKey: string;

  @ApiProperty({
    description:
      'The prebuilt configuration which should be used as a basis for this app.',
  })
  base: string;
}
