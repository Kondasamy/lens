/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type * as registries from "./registries";
import { Disposers, LensExtension } from "./lens-extension";
import type { CatalogEntity } from "../common/catalog";
import type { Disposer } from "../common/utils";
import {
  catalogEntityRegistry,
  EntityFilter,
} from "../renderer/api/catalog-entity-registry";
import {
  catalogCategoryRegistry,
  CategoryFilter,
} from "../renderer/api/catalog-category-registry";
import type { TopBarRegistration } from "../renderer/components/layout/top-bar/top-bar-registration";
import type { KubernetesCluster } from "../common/catalog-entities";
import type { WelcomeMenuRegistration } from "../renderer/components/+welcome/welcome-menu-items/welcome-menu-registration";
import type { WelcomeBannerRegistration } from "../renderer/components/+welcome/welcome-banner-items/welcome-banner-registration";
import type { CommandRegistration } from "../renderer/components/command-palette/registered-commands/commands";
import type { AppPreferenceRegistration } from "../renderer/components/+preferences/app-preferences/app-preference-registration";
import type { AdditionalCategoryColumnRegistration } from "../renderer/components/+catalog/custom-category-columns";
import type { CustomCategoryViewRegistration } from "../renderer/components/+catalog/custom-views";
import type { StatusBarRegistration } from "../renderer/components/status-bar/status-bar-registration";
import type { KubeObjectMenuRegistration } from "../renderer/components/kube-object-menu/dependencies/kube-object-menu-items/kube-object-menu-registration";
import { getLegacyGlobalDiForExtensionApi } from "./as-legacy-globals-for-extension-api/legacy-global-di-for-extension-api";
import routesInjectable from "../renderer/routes/routes.injectable";
import { fromPairs, map, matches, toPairs } from "lodash/fp";
import { getExtensionRouteId } from "../renderer/routes/get-extension-route-id";
import navigateToRouteInjectable from "../renderer/routes/navigate-to-route.injectable";
import extensionPageParametersInjectable from "../renderer/routes/extension-page-parameters.injectable";
import { pipeline } from "@ogre-tools/fp";

export class LensRendererExtension extends LensExtension {
  globalPages: registries.PageRegistration[] = [];
  clusterPages: registries.PageRegistration[] = [];
  clusterPageMenus: registries.ClusterPageMenuRegistration[] = [];
  kubeObjectStatusTexts: registries.KubeObjectStatusRegistration[] = [];
  appPreferences: AppPreferenceRegistration[] = [];
  entitySettings: registries.EntitySettingRegistration[] = [];
  statusBarItems: StatusBarRegistration[] = [];
  kubeObjectDetailItems: registries.KubeObjectDetailRegistration[] = [];
  kubeObjectMenuItems: KubeObjectMenuRegistration[] = [];
  kubeWorkloadsOverviewItems: registries.WorkloadsOverviewDetailRegistration[] = [];
  commands: CommandRegistration[] = [];
  welcomeMenus: WelcomeMenuRegistration[] = [];
  welcomeBanners: WelcomeBannerRegistration[] = [];
  catalogEntityDetailItems: registries.CatalogEntityDetailRegistration<CatalogEntity>[] = [];
  topBarItems: TopBarRegistration[] = [];
  additionalCategoryColumns: AdditionalCategoryColumnRegistration[] = [];
  customCategoryViews: CustomCategoryViewRegistration[] = [];

  async navigate<P extends object>(pageId?: string, params?: P) {
    const di = getLegacyGlobalDiForExtensionApi();

    const navigateToRoute = di.inject(navigateToRouteInjectable);
    const routes = di.inject(routesInjectable).get();
    const extensionRoutes = routes.filter(matches({ extension: this }));

    const targetRouteId = getExtensionRouteId(
      this.sanitizedExtensionId,
      pageId,
    );
    const targetRoute = extensionRoutes.find(matches({ id: targetRouteId }));

    const targetRegistration = [...this.globalPages, ...this.clusterPages].find(
      matches({ id: pageId }),
    );

    const normalizedParams = di.inject(extensionPageParametersInjectable, {
      extension: this,
      registration: targetRegistration,
    });

    if (targetRoute) {
      const query = pipeline(
        params,

        toPairs,

        map(([key, value]) => {
          const normalizedParam = normalizedParams[key];

          return [
            key,
            normalizedParam.stringify(value),
          ];
        }),

        fromPairs,
      );

      navigateToRoute(targetRoute, {
        query,
      });
    }
  }

  /**
   * Defines if extension is enabled for a given cluster. This method is only
   * called when the extension is created within a cluster frame.
   *
   * The default implementation is to return `true`
   */
  async isEnabledForCluster(cluster: KubernetesCluster): Promise<Boolean> {
    return (void cluster) || true;
  }

  /**
   * Add a filtering function for the catalog entities. This will be removed if the extension is disabled.
   * @param fn The function which should return a truthy value for those entities which should be kept.
   * @returns A function to clean up the filter
   */
  addCatalogFilter(fn: EntityFilter): Disposer {
    const dispose = catalogEntityRegistry.addCatalogFilter(fn);

    this[Disposers].push(dispose);

    return dispose;
  }

  /**
   * Add a filtering function for the catalog categories. This will be removed if the extension is disabled.
   * @param fn The function which should return a truthy value for those categories which should be kept.
   * @returns A function to clean up the filter
   */
  addCatalogCategoryFilter(fn: CategoryFilter): Disposer {
    const dispose = catalogCategoryRegistry.addCatalogCategoryFilter(fn);

    this[Disposers].push(dispose);

    return dispose;
  }
}
