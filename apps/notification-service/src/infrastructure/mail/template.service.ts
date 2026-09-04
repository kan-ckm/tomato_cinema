import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as Handlebars from 'handlebars'
import path from 'path'

@Injectable()
export class TemplateService {
	private readonly logger = new Logger(TemplateService.name)
	private readonly cache = new Map<string, Handlebars.TemplateDelegate>()

	public async render(
		templateName: string,
		context?: Record<string, any>
	): Promise<string> {
		if (!this.cache.has(templateName)) {
			/**
			 * -------------------------------------------------------------------------
			 * 🔍 CẤU HÌNH TỰ ĐỘNG TÌM ĐƯỜNG DẪN FILE TEMPLATE (.hbs):
			 * -------------------------------------------------------------------------
			 * Vì dự án là Monorepo và có nhiều cách chạy (Local Dev, Docker, Production),
			 * giá trị `process.cwd()` (thư mục làm việc hiện tại) sẽ khác nhau tùy ngữ cảnh:
			 *
			 * 1. Docker Monorepo: `process.cwd()` là `/app` (thư mục gốc toàn bộ monorepo),
			 *    nên file nằm tại: `/app/apps/notification-service/src/infrastucture/mail/templates/...`
			 *
			 * 2. Local Dev: Khi bạn `cd apps/notification-service` và chạy `pnpm run dev`,
			 *    `process.cwd()` chính là service này, nên file nằm tại: `src/infrastucture/mail/templates/...`
			 *
			 * 3. Production Dist Assets: Dành cho trường hợp template được build copy vào
			 *    ngang hàng với file thực thi `dist/` (`__dirname/templates/...`).
			 *
			 * 4. Dist trỏ về Src: Khi chạy code đã compile từ `dist/infrastucture/mail/`
			 *    nhưng cần đọc ngược lại file .hbs từ thư mục `src/` gốc.
			 * -------------------------------------------------------------------------
			 */
			const candidatePaths = [
				path.join(
					process.cwd(),
					'apps/notification-service/src/infrastucture/mail/templates',
					`${templateName}.hbs`
				),
				path.join(
					process.cwd(),
					'src/infrastucture/mail/templates',
					`${templateName}.hbs`
				),
				path.join(__dirname, 'templates', `${templateName}.hbs`),
				path.join(
					__dirname,
					'../../../src/infrastucture/mail/templates',
					`${templateName}.hbs`
				)
			]

			// Quét lần lượt từng đường dẫn, lấy đường dẫn đầu tiên thực tế tồn tại trên ổ đĩa
			const templatePath = candidatePaths.find(p => fs.existsSync(p))

			// Báo lỗi chi tiết kèm danh sách các đường dẫn đã kiểm tra nếu không tìm thấy file
			if (!templatePath) {
				const errorMsg =
					`Không tìm thấy template: "${templateName}.hbs". Đã kiểm tra qua các đường dẫn:\n` +
					candidatePaths.map(p => ` - ${p}`).join('\n')
				this.logger.error(errorMsg)
				throw new Error(errorMsg)
			}

			const fileContent = fs.readFileSync(templatePath, 'utf-8')
			this.cache.set(templateName, Handlebars.compile(fileContent))
		}

		const template = this.cache.get(templateName)
		return template!(context)
	}
}
