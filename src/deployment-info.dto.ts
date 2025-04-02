import { ApiProperty } from '@nestjs/swagger';

export class DeploymentInfo {
  @ApiProperty({
    description:
      'Name of the system to be created. Must not contain whitespaces.',
  })
  instance: string;

  @ApiProperty({
    description:
      'The prebuilt configuration which should be used as a basis for this app.',
  })
  baseConfig: string;

  @ApiProperty({
    description: 'Language for the system (and keycloak).',
  })
  locale?: string;

  @ApiProperty({
    description: 'Username of the initial user account created as site admin.',
  })
  userName: string;

  @ApiProperty({
    description: 'Email for the initial user account.',
  })
  userEmail: string;

  @ApiProperty({
    description:
      'Whether the permission backend (replication-backend) should be set up.',
  })
  withReplicationBackend: boolean;

  @ApiProperty({
    description:
      'Whether the am-backend-services (query-backend) should be set up.',
  })
  withBackend = false;

  @ApiProperty({
    description: 'Whether the new system should be added to uptime monitoring.',
  })
  withMonitoring: boolean;

  @ApiProperty({
    description: 'Whether the new system should be added to sentry monitoring.',
  })
  withSentry = false;

  @ApiProperty({
    description: 'Name of the Keycloak confidential client.',
  })
  keycloakClientId: string;

  @ApiProperty({
    description: 'Credentials for the Keycloak confidential client.',
  })
  keycloakClientSecret: string;
}
