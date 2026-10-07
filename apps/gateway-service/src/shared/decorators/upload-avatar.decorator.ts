import {
	BadRequestException,
	FileTypeValidator,
	MaxFileSizeValidator,
	ParseFilePipe,
	UploadedFile
} from '@nestjs/common'

export const uploadedAvatar = (maxSizeMb = 10) => {
	return UploadedFile(
		new ParseFilePipe({
			validators: [
				new MaxFileSizeValidator({
					maxSize: maxSizeMb * 1024 * 1024, // 10MB
					message: 'Dung lượng ảnh không được vượt quá 10MB'
				}),
				new FileTypeValidator({
					fileType: /^image\/(jpeg|png|webp)$/i
				})
			],
			exceptionFactory(error) {
				// Nếu lỗi do kích thước
				if (error.includes('10MB')) {
					return new BadRequestException(
						`Dung lượng ảnh không được vượt quá ${maxSizeMb}MB`
					)
				}
				// Mặc định các lỗi còn lại là sai định dạng file
				return new BadRequestException(
					'File không đúng định dạng! Vui lòng chỉ tải lên ảnh JPG, PNG hoặc WEBP'
				)
			},
			fileIsRequired: true // Bắt buộc phải chọn file mới gửi request
		})
	)
}

export const uploadedAvater = uploadedAvatar
