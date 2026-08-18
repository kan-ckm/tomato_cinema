import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as Handlebars from 'handlebars'
import path from 'path'

@Injectable()
export class TemplateService {
	private cache = new Map<string, Handlebars.TemplateDelegate>()

	public async render(templateName: string, context?: Record<string, any>) {
		if (!this.cache.has(templateName)) {
			const templatePath = path.join(
				process.cwd(),
				'src/infrastucture/mail/templates',
				`${templateName}.hbs`
			)

			const file = fs.readFileSync(templatePath, 'utf-8')
			this.cache.set(templateName, Handlebars.compile(file))
		}

		const template = this.cache.get(templateName)

		return template!(context)
	}
}
