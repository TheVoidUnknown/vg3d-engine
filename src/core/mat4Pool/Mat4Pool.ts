import { Matrix4 } from "three";

export class Mat4Pool {
  private static _pool: Matrix4[] = [];
  private static _count = 0;

  public static get(): Matrix4 {
    if (this._count > 0) {
      this._count--;
      const matrix = this._pool[this._count];
      return matrix;
    }

    return new Matrix4();
  }

  public static release(matrix: Matrix4): void {
    // Reset to identity for next use
    matrix.identity(); 
    this._pool[this._count] = matrix;
    this._count++;
  }

  public static logStatus(): void {
    console.log(`Matrix4Pool: ${this._count} available`);
  }
}