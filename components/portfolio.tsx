"use client";

import * as React from "react";
import { CaretSortIcon, ChevronDownIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { fetchCoinPriceByName } from "@/utils/fetchCmkPrice";
import { propagateServerField } from "next/dist/server/lib/render-server";
import { AssetItem, DexItem } from "@/Models/AssetItems";

export type Assets = {
  asset: string;
  amount: number;
  price: number;
  total: number;
  at: string;
};

export const columns: ColumnDef<Assets>[] = [
  {
    accessorKey: "asset",
    header: ({ column }) => {
      return (
        <div className="min-w-[120px]">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Asset
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => <div className="min-w-[120px] uppercase ml-4">{row.getValue("asset")}</div>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <div className="min-w-[120px]">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => <div className="min-w-[120px] lowercase ml-4">{row.getValue("amount")}</div>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <div className="min-w-[120px]">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Price
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => <div className="min-w-[120px] lowercase ml-4">{row.getValue("price")}</div>,
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <div className="min-w-[120px]">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Total
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => <div className="min-w-[120px] lowercase ml-4">{row.getValue("total")}</div>,
  },
  {
    accessorKey: "at",
    header: ({ column }) => {
      return (
        <div className="min-w-[120px]">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            At
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => <div className="min-w-[120px] ml-4">{row.getValue("at")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => window.open("https://www.google.com", "_blank")}>Trade!</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://www.coinmarketcap.com", "_blank")}>
              View more info.
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface AssetItemListProps {
  portfolio?: AssetItem[];
  dexportfolio?: DexItem[];
  prices?: number[];
}

export function Portfolio({ portfolio, dexportfolio, prices }: AssetItemListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  interface TableData {
    asset: string;
    amount: number;
    price: number;
    total: number;
    at: string;
  }

  const formatPrice = (price: number) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 4, // Minimum number of decimal places
      maximumFractionDigits: 4, // Maximum number of decimal places
    });
    return formatter.format(price);
  };

  // Combine portfolio and DEX portfolio into a single data array
  // use useMemo to avoid re-rendering the table on every state change
  const combinedData = React.useMemo(
    () => [
      ...(portfolio ?? [])
        .filter((item: AssetItem) => Number(item.free) + Number(item.locked) > 0)
        .map((item: AssetItem, index: number) => ({
          asset: item.asset,
          amount: parseFloat(formatPrice(Number(item.free) + Number(item.locked))),
          price: parseFloat(formatPrice(prices?.[index] ?? 0)), // Use the corresponding fetched price
          total: parseFloat(formatPrice((Number(item.free) + Number(item.locked)) * (prices?.[index] ?? 0))),
          at: "Binance.US",
        })),
      ...(dexportfolio ?? [])
        .filter((item: DexItem) => Number(item.amount) > 0)
        .map((item: DexItem, index: number) => ({
          asset: item.symbol,
          amount: parseFloat(formatPrice(Number(item.amount))),
          price: parseFloat(formatPrice(Number(item.tokenPrice))), // Use the corresponding fetched price
          total: parseFloat(formatPrice(Number(item.amount) * Number(item.tokenPrice))),
          at: "Ethereum",
        })),
    ],
    [portfolio, dexportfolio, prices],
  );

  const table = useReactTable<TableData>({
    data: combinedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter exchanges..."
          value={(table.getColumn("at")?.getFilterValue() as string) ?? ""}
          onChange={event => table.getColumn("at")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} asset(s) in total.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
