import { OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { lastValueFrom, Observable } from 'rxjs'

type UnwrapObservable<U> = U extends Observable<infer R> ? R : U

export abstract class AbstractGrpcClient<
	T extends Record<string, any>
> implements OnModuleInit {
	protected service!: T

	protected constructor(
		private readonly client: ClientGrpc,
		private readonly serviceName: string
	) {}

	public onModuleInit() {
		this.service = this.client.getService<T>(this.serviceName)
	}

	public async call<K extends keyof T>(
		method: K,
		...args: Parameters<T[K]>
	): Promise<UnwrapObservable<ReturnType<T[K]>>> {
		try {
			const observable = this.service[method](...args)
			const result = await lastValueFrom(observable)

			return result as UnwrapObservable<ReturnType<T[K]>>
		} catch (error) {
			throw error
		}
	}
}
