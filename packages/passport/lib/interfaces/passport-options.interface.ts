export interface PassportOptions {
	
	secretKey: string
}
export interface PassportAsyncOptions {
  useFactory: (...args: any[]) => Promise<PassportOptions> | PassportOptions;
  inject?: any[];
  imports?: any[];
} 