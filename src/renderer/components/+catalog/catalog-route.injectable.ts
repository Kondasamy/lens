/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { routeInjectionToken } from "../../routes/all-routes.injectable";

const catalogRouteInjectable = getInjectable({
  id: "catalog-route",

  instantiate: () => ({
    path: "/catalog/:group?/:kind?",
    clusterFrame: false,
    isEnabled: computed(() => true),
  }),

  injectionToken: routeInjectionToken,
});

export default catalogRouteInjectable;
