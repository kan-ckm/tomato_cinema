import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './core/app.module'
import { getCorsconfig, getValidationPipeConfig } from './core/config'
import { GrcpExceotionFilter } from './shared/filters'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = app.get(ConfigService)
	const logger = new Logger()
	// cấu hình tự động hóa kiểm tra định dạng bảo vệ dữ liệu và dọn dẹp
	app.useGlobalPipes(new ValidationPipe(getValidationPipeConfig()))

	app.useGlobalFilters(new GrcpExceotionFilter())

	app.enableCors(getCorsconfig(config))
	// cấu hình UI cho docs API
	const swaggerConfig = new DocumentBuilder()
		.setTitle('TomatoCinema API')
		.setDescription('API Gateway cho TomatoCinema microservice')
		.setVersion('1.0.0')
		.addBearerAuth()
		.build()

	const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)

	SwaggerModule.setup('/docs', app, swaggerDocument, {
		yamlDocumentUrl: '/openapi.yaml'
	})

	const port = config.getOrThrow<number>('HTTP_PORT')
	const host = config.getOrThrow<string>('HTTP_HOST')

	await app.listen(port)

	logger.log(`🚀 Gateway started: ${host}`)
	logger.log(`📚 Swager: ${host}/docs`)
}
bootstrap()
