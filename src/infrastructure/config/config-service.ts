import 'reflect-metadata'

import { plainToInstance } from 'class-transformer'
import { IsString, validateSync } from 'class-validator'

import {ApplicationConfiguration} from './model'

class EnvironmentVariables {
  @IsString()
  REDIS_URL: string
}

export class ConfigService {
  private readonly _config: ApplicationConfiguration

  constructor() {
    const envVariables: Record<string, string> = {
      REDIS_URL: process.env.REDIS_URL!,
    }

    const validatedConfig = this.validate(envVariables)

    this._config = {
      REDIS_URL: validatedConfig.REDIS_URL,
    }
    console.log('CONFIG IS READY!')
  }

  get config(): ApplicationConfiguration {
    return this._config
  }

  private validate(
    environmentVariable: Record<string, string>,
  ): EnvironmentVariables {
    const validatedConfig = plainToInstance(
      EnvironmentVariables,
      environmentVariable,
      {
        enableImplicitConversion: true,
      },
    )

    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    })

    if (errors.length > 0) {
      throw new Error(
        `Environment variable validation error: ${errors.toString()}`,
      )
    }

    return validatedConfig
  }
}
