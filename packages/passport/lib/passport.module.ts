import { DynamicModule, Global, Module } from "@nestjs/common";
import { PassportAsyncOptions, PassportOptions } from "./interfaces";
import { createPassportAsyncOptionProvider, createPassportOptionsProvider } from "./passport.providers";
import { PassportService } from "./passport.service";
import { PASSPORT_OPTIONS } from "./constants";
@Global()
@Module({})
export class PassportModule {
    public static register(options: PassportOptions): DynamicModule{
        const optionProvider = createPassportOptionsProvider(options)

        return {
            module: PassportModule,
            providers: [optionProvider, PassportService],
            exports: [PassportService, PASSPORT_OPTIONS]
        }
    }

    public static registerAsync(options: PassportAsyncOptions):DynamicModule {
        const optionsProvider = createPassportAsyncOptionProvider(options as any)

        return {
            module: PassportModule,
            imports: options.imports ?? [],
            providers: [optionsProvider, PassportService],
            exports:[PassportService,PASSPORT_OPTIONS]
        }
    }
}