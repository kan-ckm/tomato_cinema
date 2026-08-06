export function convertEnum<T extends object>(
	target: T,
	value: string
): T[keyof T] {
	if (!(value in target)) {
		throw new Error(`Giá trị '${value}' không tồn tại trong Enum`)
	}
	return (target as any)[value]
}
