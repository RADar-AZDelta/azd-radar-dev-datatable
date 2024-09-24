import type { IColumnMetaData, SortDirection, TFilter } from '../../interfaces/Types'
import ColumnsConfig from './ColumnsConfig.svelte'
import optionsClass from '../Options.svelte'
import { logWhenDev } from '../../utils'
import { getDataTable } from '../../stores/store.svelte'
// import type DataTable from '../datatable/DataTable.svelte'
// import datatable from '../datatable/DataTable.svelte'

class Columns extends ColumnsConfig {
  private filter: TFilter = null
  private filterColumn: string = ''
  private position: number = 0
  private positionColumn: string = ''
  private sortDirection: SortDirection = null
  private sortColumn: string = ''

  async updateColumnFilter(columnId: string, filter: TFilter) {
    this.filter = filter
    this.filterColumn = columnId
    await this.setFilterInOptions()
    await this.setFilterOnColumn()
    optionsClass.internalOptions.currentPage = 1
    await this.setInternalColumnsInDataImplementation()
    await getDataTable().dataTable?.render()
  }

  private async setFilterInOptions() {
    if (optionsClass.internalOptions.globalFilter) optionsClass.internalOptions.globalFilter.filter = this.filter
  }

  private async setFilterOnColumn() {
    if (!this.internalColumns) return
    const filterString = this.filter ? this.filter.toString().toLowerCase() : ''
    if (this.filterColumn === 'all') return this.internalColumns.forEach(column => (column.filter = filterString))
    const column = this.internalColumns.find(column => column.id === this.filterColumn)
    if (!column) return
    column.filter = filterString
    logWhenDev(`setFilterOnColumn: column '${column}' filter changed to '${this.filter}'`)
  }

  async changeColumnWidth(columnId: string, width: number) {
    if (!this.internalColumns) return
    const column = this.internalColumns.find(column => column.id === columnId)
    console.log('COL ', column)
    if (!column) return
    column.width = width
    logWhenDev(`changeColumnWidth: column '${column}' width changed to '${width}'`)
  }

  async changeColumnsPosition(columnId: string, position: number) {
    if (!this.internalColumns) return
    this.position = position
    this.positionColumn = columnId
    const sourceColumn = this.internalColumns.find(column => column.id === columnId)
    if (!sourceColumn) return
    // Clone the original position because it will be changed in the forEach and the positions will be switched up
    const sourceColumnPosition = JSON.parse(JSON.stringify(sourceColumn.position))
    for (let column of this.internalColumns) this.changeColumnPosition(column, sourceColumnPosition)
    logWhenDev(`changeColumnsPosition: column '${sourceColumn!.id}' position changed from '${sourceColumn?.position}' to '${this.position}'`)
  }

  private changeColumnPosition(column: IColumnMetaData, sourceColumnPosition: number) {
    const columnPosition = column.position ?? 0
    if (column.id === this.positionColumn) column.position = this.position
    else if (sourceColumnPosition < columnPosition && columnPosition <= this.position) column.position = columnPosition - 1
    else if (this.position <= columnPosition && columnPosition < sourceColumnPosition) column.position = columnPosition + 1
  }

  async changeColumnSort(columnId: string, sortDirection: SortDirection) {
    if (!this.internalColumns) return
    this.sortDirection = sortDirection
    this.sortColumn = columnId
    if (optionsClass.internalOptions.singleSort) this.internalColumns.forEach(column => (column.sortDirection = undefined))
    const internalColumn = this.internalColumns.find(column => column.id === this.sortColumn)
    if (!internalColumn) return
    internalColumn.sortDirection = this.sortDirection
    optionsClass.internalOptions.currentPage = 1
    await this.setInternalColumnsInDataImplementation()
    logWhenDev(`DataTable: column '${this.sortColumn}' sort changed to '${sortDirection}'`)
    await getDataTable().dataTable?.render()
  }

  async updateColumns(columns: IColumnMetaData[]) {
    if (!this.internalColumns) return
    for (let column of columns) await this.updateColumn(column)
  }

  private async updateColumn(column: IColumnMetaData) {
    if (!this.internalColumns) return
    const index = this.internalColumns.findIndex(col => col.id === column.id)
    if (index === -1) throw new Error(`Column with id ${column.id} doesn't exist`)
    else Object.assign(this.internalColumns[index], column)
  }

  getTotalColumns() {
    const { actionColumn } = optionsClass.internalOptions
    return (this.internalColumns?.length ?? 0) + (actionColumn ? 1 : 0)
  }
}

const columns = new Columns()
export default columns
