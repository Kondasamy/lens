/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { noop, some } from "lodash/fp";
import { computed } from "mobx";

import {
  SidebarItemRegistration,
  sidebarItemsInjectionToken,
} from "../layout/sidebar-items.injectable";
import { Icon } from "../icon";
import React from "react";

import crdListRouteInjectable from "./crd-list-route.injectable";
import sidebarItemsForDefinitionGroupsInjectable from "./sidebar-items-for-definition-groups.injectable";
import navigateToRouteInjectable from "../../routes/navigate-to-route.injectable";
import routeIsActiveInjectable from "../../routes/route-is-active.injectable";

const customResourceSidebarItemsInjectable = getInjectable({
  id: "custom-resource-sidebar-items",

  instantiate: (di) => {
    const navigateToRoute = di.inject(navigateToRouteInjectable);
    const crdListRoute = di.inject(crdListRouteInjectable);
    const crdListRouteIsActive = di.inject(routeIsActiveInjectable, crdListRoute);

    const definitionGroupSidebarItems = di.inject(
      sidebarItemsForDefinitionGroupsInjectable,
    );

    return computed((): SidebarItemRegistration[] => {
      const definitionsItem = {
        id: "definitions",
        parentId: "custom-resources",
        title: "Definitions",
        onClick: () => navigateToRoute(crdListRoute),
        isActive: crdListRouteIsActive,
        isVisible: crdListRoute.isEnabled,
        priority: 10,
      };

      const definitionGroupItems = definitionGroupSidebarItems.get();

      const childrenAndGrandChildren = [
        definitionsItem,
        ...definitionGroupItems,
      ];

      const parentItem: SidebarItemRegistration = {
        id: "custom-resources",
        parentId: null,
        title: "Custom Resources",
        getIcon: () => <Icon material="extension" />,
        onClick: noop,
        isVisible: computed(() => some(item => item.isVisible.get(), childrenAndGrandChildren)),
        priority: 110,
      };

      return [parentItem, definitionsItem, ...definitionGroupItems];
    });
  },

  injectionToken: sidebarItemsInjectionToken,
});

export default customResourceSidebarItemsInjectable;
