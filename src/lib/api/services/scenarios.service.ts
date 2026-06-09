//  src/lib/api/services/scenarios.service.ts


import { apiClient } from '@/lib/api/axios';
import {
  Scenario,
  ScenarioRequest,
  PaginatedScenarioList,
} from '@/lib/api/types';

class ScenariosService {
  private static readonly endpoint = '/ecosystem/scenarios/';

  static async getAll(projectUuid: string): Promise<PaginatedScenarioList> {
    const { data } = await apiClient.get<PaginatedScenarioList>(this.endpoint, {
      params: { project: projectUuid },
    });
    return data;
  }

  static async getById(uuid: string): Promise<Scenario> {
    const { data } = await apiClient.get<Scenario>(
      `${this.endpoint}${encodeURIComponent(uuid)}/`
    );
    return data;
  }

  static async create(payload: ScenarioRequest): Promise<Scenario> {
    const { data } = await apiClient.post<Scenario>(this.endpoint, payload);
    return data;
  }

  static async update(
    uuid: string,
    payload: Partial<ScenarioRequest>
  ): Promise<Scenario> {
    const { data } = await apiClient.patch<Scenario>(
      `${this.endpoint}${encodeURIComponent(uuid)}/`,
      payload
    );
    return data;
  }

  static async delete(uuid: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}${encodeURIComponent(uuid)}/`);
  }
}

export default ScenariosService;
