import { desc, escape, op } from 'arquero'
import Arquero from './FileWorkerLoad'
import type { MessageRequestFetchData } from './messages'
import type Table from 'arquero/dist/types/table/table'
import type { SortDirection, TFilter } from '../interfaces/Types'

export default class Fetch extends Arquero {
  getColumnNames = () => {
    const res = this.dt?.columnNames()
    return res
  }

  async fetchData(data: MessageRequestFetchData) {
    await this.filterAndSortTempDt(data)
    const matrixInfo = await this.createMatrix(data)
    const { totalRows, data: matrix, indices } = matrixInfo!
    return { totalRows, data: matrix, indices }
  }

  private async filterAndSortTempDt(data: MessageRequestFetchData) {
    if (data.onlyPaginationChanged && this.tempDt) return
    this.tempDt = this.dt
    if (data.filteredColumns.size === 1 && [...data.filteredColumns.keys()][0] === 'all') await this.applyGlobalFilter(data)
    else this.tempDt = await this.applyMultipleFilters(data.filteredColumns, this.tempDt!)
    this.tempDt = await this.sortTempDt(data.sortedColumns, this.tempDt!)
  }

  private async applyGlobalFilter(data: MessageRequestFetchData) {
    if (!this.tempDt) return
    const filter = [...data.filteredColumns.values()][0]
    const lFilter = filter?.toString().toLowerCase()
    const columns = this.tempDt.columnNames()
    this.tempDt = this.tempDt.filter(
      escape((d: any) => columns.reduce((acc: boolean, curr: string) => (acc = acc || op.lower(d[curr])?.includes(lFilter)), false)),
    )
  }

  async applyMultipleFilters(filteredColumns: Map<string, TFilter>, tempDt: Table) {
    for (const [column, filter] of [...filteredColumns.entries()]) {
      const lFilter = filter?.toString().toLowerCase()
      if (!lFilter) continue
      const reg = new RegExp(lFilter)
      tempDt = tempDt!.params({ column, reg }).filter((r: any, params: any) => op.match(op.lower(r[params.column]), params.reg, 0))
    }
    return tempDt
  }

  async sortTempDt(sortedColumns: Map<string, SortDirection>, tempDt: Table) {
    for (const [column, sortDirection] of [...sortedColumns].reverse()) {
      //Sort is applied in reverse order !!!
      if (sortDirection === 'asc') tempDt = tempDt.orderby(column)
      else if (sortDirection === 'desc') tempDt = tempDt.orderby(desc(column))
    }
    return tempDt
  }

  private async createMatrix(data: MessageRequestFetchData) {
    if (!this.tempDt) return
    let totalRows = 0,
      matrix: any[][] = [],
      indices: any = []
    totalRows = this.tempDt.numRows()
    const { rowsPerPage, currentPage } = data.pagination
    const objects = this.tempDt.objects({ limit: rowsPerPage, offset: (currentPage! - 1) * rowsPerPage! })
    indices = this.tempDt.indices().slice((currentPage! - 1) * rowsPerPage!, currentPage! * rowsPerPage!)
    matrix = objects.map(obj => Object.values(obj))
    return { totalRows, data: matrix, indices }
  }
}
