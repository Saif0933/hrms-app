import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// ─── Interfaces & Types ──────────────────────────────────────────────────────

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  tagline?: string | null;
  icon?: string | null;
  iconBg?: string | null;
  price: number;
  billing: string;
  btnText: string;
  btnStyle?: string | null;
  checkColor?: string | null;
  popular: boolean;
  features: string[];
  maxEmployees: number;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  billingCycle: 'ANNUAL' | 'MONTHLY';
  pricePaid: number;
  startDate: string;
  endDate?: string | null;
  autoRenew: boolean;
  paymentStatus: string;
  plan?: SubscriptionPlan;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrentSubscriptionResponse {
  isSubscribed: boolean;
  subscriptionId?: string;
  organizationId?: string;
  currentPlan: SubscriptionPlan;
  status: string;
  billingCycle: string;
  pricePaid?: number;
  startDate?: string | null;
  endDate?: string | null;
  autoRenew?: boolean;
  paymentStatus?: string;
}

export interface FeatureComparisonRow {
  id: string;
  label: string;
  basic: string;
  pro: string;
  ent: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscribePlanPayload {
  planId: string;
  billingCycle?: 'ANNUAL' | 'MONTHLY';
  organizationId?: string;
}

export type CreateSubscriptionPlanPayload = Omit<
  SubscriptionPlan,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateSubscriptionPlanPayload = Partial<CreateSubscriptionPlanPayload>;

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetch all available subscription plans
 * Route: GET /api/v1/subscriptions/plans
 */
export const useSubscriptionPlans = () => {
  return useQuery<BaseResponse<SubscriptionPlan[]>, Error>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<SubscriptionPlan[]>>('/subscriptions/plans');
      return response.data;
    },
  });
};

/**
 * Fetch a single subscription plan by ID or code
 * Route: GET /api/v1/subscriptions/plans/:id
 */
export const useSubscriptionPlan = (idOrCode: string | undefined) => {
  return useQuery<BaseResponse<SubscriptionPlan>, Error>({
    queryKey: ['subscriptionPlan', idOrCode],
    queryFn: async () => {
      if (!idOrCode) throw new Error('Plan ID or Code is required');
      const response = await apiClient.get<BaseResponse<SubscriptionPlan>>(`/subscriptions/plans/${idOrCode}`);
      return response.data;
    },
    enabled: !!idOrCode,
  });
};

/**
 * Fetch current active subscription for an organization
 * Route: GET /api/v1/subscriptions/current
 */
export const useCurrentSubscription = (organizationId?: string) => {
  return useQuery<BaseResponse<CurrentSubscriptionResponse>, Error>({
    queryKey: ['currentSubscription', organizationId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<CurrentSubscriptionResponse>>('/subscriptions/current', {
        params: organizationId ? { organizationId } : undefined,
      });
      return response.data;
    },
  });
};

/**
 * Fetch feature comparison matrix table
 * Route: GET /api/v1/subscriptions/compare
 */
export const useSubscriptionComparisons = () => {
  return useQuery<BaseResponse<FeatureComparisonRow[]>, Error>({
    queryKey: ['subscriptionComparisons'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<FeatureComparisonRow[]>>('/subscriptions/compare');
      return response.data;
    },
  });
};

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/**
 * Subscribe or upgrade organization plan
 * Route: POST /api/v1/subscriptions/subscribe
 */
export const useSubscribePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<OrganizationSubscription>, Error, SubscribePlanPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<OrganizationSubscription>>('/subscriptions/subscribe', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    },
  });
};

/**
 * Create a new subscription plan (Admin)
 * Route: POST /api/v1/subscriptions/plans
 */
export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<SubscriptionPlan>, Error, CreateSubscriptionPlanPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<SubscriptionPlan>>('/subscriptions/plans', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    },
  });
};

/**
 * Update an existing subscription plan by ID (Admin)
 * Route: PATCH /api/v1/subscriptions/plans/:id
 */
export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<SubscriptionPlan>,
    Error,
    { id: string; data: UpdateSubscriptionPlanPayload }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<BaseResponse<SubscriptionPlan>>(`/subscriptions/plans/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlan', variables.id] });
    },
  });
};

/**
 * Delete a subscription plan by ID (Admin)
 * Route: DELETE /api/v1/subscriptions/plans/:id
 */
export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<BaseResponse<any>>(`/subscriptions/plans/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    },
  });
};
