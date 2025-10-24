import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for AI requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Types
export interface GenerateDatabaseRequest {
  prompt: string;
  aiProvider?: string;
}

export interface GenerateDatabaseResponse {
  sql: string;
  schema_data: any;
  diagram_data?: any;
  success: boolean;
  message: string;
}

export interface ExecuteSQLRequest {
  sql: string;
}

export interface ExecuteSQLResponse {
  success: boolean;
  results?: any[];
  error?: string;
}

export interface SaveSchemaRequest {
  prompt: string;
  sql_code: string;
  schema_json: any;
}

export interface SaveSchemaResponse {
  success: boolean;
  message: string;
  schema_id?: number;
}

export interface SavedSchema {
  id: number;
  prompt: string;
  sql_code: string;
  schema_data: string;
  created_at: string;
}

export interface SchemaListResponse {
  schemas: SavedSchema[];
  success: boolean;
  message: string;
}

export interface DeleteSchemaResponse {
  success: boolean;
  message: string;
}

export interface ResetDatabaseResponse {
  success: boolean;
  message: string;
}

export interface GenerateLayoutRequest {
  entities: any[];
  relationships: any[];
}

export interface GenerateLayoutResponse {
  positions: Record<string, { x: number; y: number }>;
  success: boolean;
  message: string;
}

// API Functions
export const generateDatabase = async (
  prompt: string, 
  aiProvider: string = 'gemini'
): Promise<GenerateDatabaseResponse> => {
  try {
    const response = await api.post<GenerateDatabaseResponse>('/generate-database', {
      prompt,
      aiProvider,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error generating database:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to generate database'
    );
  }
};

export const executeSQL = async (sql: string): Promise<ExecuteSQLResponse> => {
  try {
    const response = await api.post<ExecuteSQLResponse>('/execute-sql', { sql });
    return response.data;
  } catch (error: any) {
    console.error('Error executing SQL:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to execute SQL'
    );
  }
};

export const saveSchema = async (
  prompt: string, 
  sql_code: string, 
  schema_json: any
): Promise<SaveSchemaResponse> => {
  try {
    const response = await api.post<SaveSchemaResponse>('/save-schema', {
      prompt,
      sql_code,
      schema_json,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error saving schema:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to save schema'
    );
  }
};

export const getSavedSchemas = async (): Promise<SchemaListResponse> => {
  try {
    const response = await api.get<SchemaListResponse>('/saved-schemas');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching saved schemas:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch saved schemas'
    );
  }
};

export const deleteSchema = async (id: number): Promise<DeleteSchemaResponse> => {
  try {
    const response = await api.delete<DeleteSchemaResponse>(`/schemas/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting schema:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete schema'
    );
  }
};

export const resetDatabase = async (): Promise<ResetDatabaseResponse> => {
  try {
    const response = await api.post<ResetDatabaseResponse>('/reset-database');
    return response.data;
  } catch (error: any) {
    console.error('Error resetting database:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to reset database'
    );
  }
};

// Health check function
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Generate AI-powered layout positions
export const generateLayoutPositions = async (
  entities: any[],
  relationships: any[]
): Promise<GenerateLayoutResponse> => {
  try {
    const response = await api.post<GenerateLayoutResponse>('/generate-layout', {
      entities,
      relationships,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error generating layout:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to generate layout'
    );
  }
};
