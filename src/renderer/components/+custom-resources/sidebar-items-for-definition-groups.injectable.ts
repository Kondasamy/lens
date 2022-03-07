/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import crdListRouteInjectable from "./crd-list-route.injectable";
import customResourceDefinitionsInjectable from "./custom-resources.injectable";
import { groupBy, matches, noop, some, toPairs } from "lodash/fp";
import customResourcesRouteInjectable from "./custom-resources-route.injectable";
import pathParametersInjectable from "../../routes/path-parameters.injectable";
import navigateToRouteInjectable from "../../routes/navigate-to-route.injectable";
import type { SidebarItemRegistration } from "../layout/sidebar-items.injectable";
import routeIsActiveInjectable from "../../routes/route-is-active.injectable";

const sidebarItemsForDefinitionGroupsInjectable = getInjectable({
  id: "sidebar-items-for-definition-groups",

  instantiate: (di) => {
    const customResourceDefinitions = di.inject(
      customResourceDefinitionsInjectable,
    );

    const crdRoute = di.inject(customResourcesRouteInjectable);
    const crdRouteIsActive = di.inject(routeIsActiveInjectable, crdRoute);
    const crdListRoute = di.inject(crdListRouteInjectable);
    const pathParameters = di.inject(pathParametersInjectable);
    const navigateToRoute = di.inject(navigateToRouteInjectable);

    return computed((): SidebarItemRegistration[] => {
      const definitions = customResourceDefinitions.get();

      const groupedCrds = toPairs(
        groupBy((crd) => crd.getGroup(), definitions),
      );

      return groupedCrds.flatMap(([group, definitions]) => {
        const childItems = definitions.map((crd) => {
          const title = crd.getResourceKind();

          const crdPathParameters = {
            group: crd.getGroup(),
            name: crd.getPluralName(),
          };

          return {
            id: `custom-resource-definition-group-${group}-crd-${crd.getId()}`,
            parentId: `custom-resource-definition-group-${group}`,
            title,

            onClick: () =>
              navigateToRoute(crdRoute, {
                params: crdPathParameters,
              }),

            isActive: computed(
              () =>
                crdRouteIsActive.get() &&
                matches(crdPathParameters, pathParameters.get()),
            ),

            isVisible: crdListRoute.isEnabled,
            priority: 10,
          };
        });

        return [
          {
            id: `custom-resource-definition-group-${group}`,
            parentId: "custom-resources",
            title: group,
            onClick: noop,
            isVisible: computed(() => some(item => item.isVisible.get(), childItems)),
            priority: 10,
          },

          ...childItems,
        ];
      });
    });
  },
});

export default sidebarItemsForDefinitionGroupsInjectable;
