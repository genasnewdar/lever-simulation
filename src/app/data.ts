import React from "react";

export interface MyFundItem {
  url: string;
  label: string;
  svg: string;
}

export interface ProfileMenuItem {
  route: string;
  label: string;
  icon: React.ReactElement<{ className?: string }>;
}

export interface ServiceItem {
  svg: string;
  text: string;
}

export const myFund: MyFundItem[] = [];

export const profileMenu: ProfileMenuItem[] = [];

export const service: ServiceItem[] = [];
