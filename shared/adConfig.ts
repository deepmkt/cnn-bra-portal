// Ad configuration for CNN BRA Portal
// Real ad banners uploaded to CDN

export const AD_BANNERS = {
  // 728x90 horizontal banners (top, middle, bottom)
  horizontal: [
    {
      id: 'camara-maceio-728',
      url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663324426524/cODUVLbryaStQDrP.gif',
      alt: 'Câmara Municipal de Maceió',
      width: 728,
      height: 90,
    },
    {
      id: 'saude-fica-728',
      url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663324426524/cXFUcwHQfpLfcCbF.gif',
      alt: 'O Transtorno Passa - Saúde Fica',
      width: 728,
      height: 90,
    },
    {
      id: 'esqueci-dinheiro-728',
      url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663324426524/HDilcbvTGtVSEHxM.gif',
      alt: 'Esqueci Dinheiro - IPVA e Amarelinha',
      width: 728,
      height: 90,
    },
  ],
  
  // 300x250 sidebar banners
  sidebar: [
    {
      id: 'saude-fica-300',
      url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663324426524/lJkzPhiIpTywqKDA.gif',
      alt: 'O Transtorno Passa - Saúde Fica',
      width: 300,
      height: 250,
    },
    {
      id: 'camara-maceio-300',
      url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663324426524/BxBLMULqufzYpfWE.gif',
      alt: 'Câmara Municipal de Maceió',
      width: 300,
      height: 250,
    },
  ],
};

/**
 * Get a random ad from a specific category
 */
export function getRandomAd(category: 'horizontal' | 'sidebar') {
  const ads = AD_BANNERS[category];
  return ads[Math.floor(Math.random() * ads.length)];
}

/**
 * Get ad by rotation (sequential)
 */
export function getAdByRotation(category: 'horizontal' | 'sidebar', index: number) {
  const ads = AD_BANNERS[category];
  return ads[index % ads.length];
}
