"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { columns, Payment } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useState } from "react";
import ProtectedRoute from "@/components/protected-route";

export default function Page() {
  const [data, setData] = useState<Payment[]>([
    {
      id: "a1b2c3d4",
      amount: 230,
      status: "success",
      email: "john.doe@example.com",
    },
    {
      id: "f7g8h9i0",
      amount: 75,
      status: "pending",
      email: "alice.w@example.com",
    },
    {
      id: "x9y8z7w6",
      amount: 310,
      status: "failed",
      email: "sam99@example.com",
    },
    {
      id: "j3k4l5m6",
      amount: 120,
      status: "success",
      email: "mary.l@example.com",
    },
    {
      id: "n1o2p3q4",
      amount: 45,
      status: "pending",
      email: "kevin@example.com",
    },
    {
      id: "r5s6t7u8",
      amount: 500,
      status: "success",
      email: "lucy.j@example.com",
    },
    {
      id: "v9w0x1y2",
      amount: 88,
      status: "failed",
      email: "nina@example.com",
    },
    {
      id: "z3a4b5c6",
      amount: 220,
      status: "success",
      email: "mark.t@example.com",
    },
    {
      id: "d7e8f9g0",
      amount: 99,
      status: "pending",
      email: "olivia@example.com",
    },
    {
      id: "h1i2j3k4",
      amount: 275,
      status: "success",
      email: "brad@example.com",
    },
    {
      id: "l5m6n7o8",
      amount: 60,
      status: "failed",
      email: "zoe.smith@example.com",
    },
    {
      id: "p9q0r1s2",
      amount: 305,
      status: "success",
      email: "jack.b@example.com",
    },
    {
      id: "t3u4v5w6",
      amount: 180,
      status: "pending",
      email: "emma.g@example.com",
    },
    {
      id: "x7y8z9a0",
      amount: 400,
      status: "success",
      email: "jane.d@example.com",
    },
    {
      id: "b1c2d3e4",
      amount: 135,
      status: "failed",
      email: "noah.r@example.com",
    },
  ]);
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Alveria Backtesting Platform
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Strategies</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="container mx-auto py-10">
              <DataTable columns={columns} data={data} />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
