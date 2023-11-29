export class DeploymentInfo {
  @ApiProperty({
    description: 'Name of the system to be created. Must not contain whitespaces.',
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
    description: 'Whether the permission backend (replication-backend) should be set up.',
  })
  backend: boolean;
  
  @ApiProperty({
    description: 'Whether the new system should be added to uptime monitoring.',
  })
  monitor: boolean;
  
  @ApiProperty({
    description: '???',
  })
  client: string;
  
  @ApiProperty({
    description: '???',
  })
  clientKey: string;
  
  @ApiProperty({
    description: '???',
  })
  base: string;
}
