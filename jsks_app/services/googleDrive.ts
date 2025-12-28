// Google Drive API Service

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  size?: string;
}

let accessToken: string | null = null;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '207152218307-5bab17pik3kiosq3jvdo8fiilp373bmn.apps.googleusercontent.com';

export const driveService = {
  // Set access token for Drive API
  setAccessToken: (token: string) => {
    accessToken = token;
  },

  // Get access token
  getAccessToken: () => accessToken,

  // Request Drive API access token
  requestAccessToken: (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google SDK not loaded'));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            accessToken = tokenResponse.access_token;
            console.log('✅ Drive API access token obtained');
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error('Failed to get access token'));
          }
        },
      });

      client.requestAccessToken();
    });
  },

  // List files from a specific folder
  listFilesInFolder: async (folderId: string): Promise<DriveFile[]> => {
    // If no access token, request it first
    if (!accessToken) {
      console.log('⚠️ No access token, requesting new one...');
      await driveService.requestAccessToken();
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,webViewLink,thumbnailLink,size)&orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // 401 에러 시 토큰 재발급 시도
      if (response.status === 401) {
        console.log('🔄 Token expired, requesting new token...');
        await driveService.requestAccessToken();

        // 새 토큰으로 재시도
        const retryResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,webViewLink,thumbnailLink,size)&orderBy=modifiedTime desc`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!retryResponse.ok) {
          throw new Error(`Drive API error after retry: ${retryResponse.status}`);
        }

        const retryData = await retryResponse.json();
        return retryData.files || [];
      }

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Failed to fetch drive files:', error);
      throw error;
    }
  },

  // Search files in a folder
  searchFilesInFolder: async (folderId: string, query: string): Promise<DriveFile[]> => {
    if (!accessToken) {
      console.log('⚠️ No access token, requesting new one...');
      await driveService.requestAccessToken();
    }

    try {
      const searchQuery = `'${folderId}' in parents and name contains '${query}'`;
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,size)&orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // 401 에러 시 토큰 재발급 시도
      if (response.status === 401) {
        console.log('🔄 Token expired, requesting new token...');
        await driveService.requestAccessToken();

        // 새 토큰으로 재시도
        const retryResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,size)&orderBy=modifiedTime desc`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!retryResponse.ok) {
          throw new Error(`Drive API error after retry: ${retryResponse.status}`);
        }

        const retryData = await retryResponse.json();
        return retryData.files || [];
      }

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Failed to search drive files:', error);
      throw error;
    }
  },

  // Get file metadata
  getFileMetadata: async (fileId: string): Promise<DriveFile | null> => {
    if (!accessToken) {
      console.log('⚠️ No access token, requesting new one...');
      await driveService.requestAccessToken();
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,thumbnailLink,size`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // 401 에러 시 토큰 재발급 시도
      if (response.status === 401) {
        console.log('🔄 Token expired, requesting new token...');
        await driveService.requestAccessToken();

        // 새 토큰으로 재시도
        const retryResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,thumbnailLink,size`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!retryResponse.ok) {
          throw new Error(`Drive API error after retry: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  },
};
