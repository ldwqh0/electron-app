/**
 * 计算多个数组的笛卡尔积
 * @param sets
 */
export function cartesianProduct<T> (sets: T[][]): T[][] {
  return sets.reduce((acc: T[][], currentSet) =>
    acc.flatMap(accItem => currentSet.map(currentItem => [...accItem, currentItem])),
  [[]]
  )
}
