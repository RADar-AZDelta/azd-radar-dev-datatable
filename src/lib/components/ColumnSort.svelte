<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<script lang="ts">
  import SvgIcon from '../components/SvgIcon.svelte'
  import type { Hex, SortDirection, IColumnSortProps } from '../interfaces/Types'

  let {
    column,
    sortDirection,
    disabled,
    filledColor = '#626262',
    notFilledColor = '#FFFFFF',
    filledOpacity = 1,
    notFilledOpacity = 0,
    changeColumnSort,
  }: IColumnSortProps = $props()

  let upColor: Hex = $state('#626262')
  let downColor: Hex = $state('#626262')
  let upOpacity: number = $state(1)
  let downOpacity: number = $state(1)

  async function updateColors(direction: SortDirection) {
    switch (direction) {
      case 'asc':
        upColor = filledColor
        downColor = notFilledColor
        upOpacity = filledOpacity
        downOpacity = notFilledOpacity
        break
      case 'desc':
        upColor = notFilledColor
        downColor = filledColor
        upOpacity = notFilledOpacity
        downOpacity = filledOpacity
        break
      default:
        upColor = filledColor
        downColor = filledColor
        upOpacity = filledOpacity
        downOpacity = filledOpacity
        break
    }
  }

  function onClick() {
    sortDirection = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? undefined : 'asc'
    changeColumnSort(column, sortDirection)
  }

  $effect(() => {
    updateColors(sortDirection)
  })
</script>

<button id="sort-{column}-{Math.random()}" onclick={onClick} {disabled} aria-label="Sorting">
  <SvgIcon id="updown" --up-color={upColor} --down-color={downColor} --up-opacity={upOpacity} --down-opacity={downOpacity} />
</button>
