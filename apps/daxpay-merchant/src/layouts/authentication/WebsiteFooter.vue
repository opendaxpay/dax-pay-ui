<script lang="ts" setup>
  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import beianIcon from '#/assets/system/beian.png';
  import icpIcon from '#/assets/system/icp.png';
  import zfIcon from '#/assets/system/zf.png';
  import zzIcon from '#/assets/system/zz.png';
  import {
    getCompanyEmail,
    getCompanyPhone,
    getCompanyWechat,
    getCopyright,
    getIcpInfo,
    getIcpLink,
    getIcpPlusInfo,
    getIcpPlusLink,
    getMpsInfo,
    getMpsLink,
    getPcacInfo,
    getPcacLink,
    hasWebsiteFooterContent,
    websiteConfig,
  } from '#/logics/init-website-config';

  defineOptions({
    name: 'WebsiteFooter',
  });

  // 依赖 websiteConfig 以在配置变更后重算
  const visible = computed(() => {
    void websiteConfig.value;
    return hasWebsiteFooterContent();
  });

  const year = new Date().getFullYear();

  const phone = computed(() => {
    void websiteConfig.value;
    return getCompanyPhone();
  });
  const email = computed(() => {
    void websiteConfig.value;
    return getCompanyEmail();
  });
  const wechat = computed(() => {
    void websiteConfig.value;
    return getCompanyWechat();
  });
  const copyright = computed(() => {
    void websiteConfig.value;
    return getCopyright();
  });

  const filings = computed(() => {
    void websiteConfig.value;
    const items: { icon: string; text: string; link: string }[] = [];
    const icp = getIcpInfo();
    if (icp) {
      items.push({ icon: icpIcon, text: icp, link: getIcpLink() });
    }
    const mps = getMpsInfo();
    if (mps) {
      items.push({ icon: beianIcon, text: mps, link: getMpsLink() });
    }
    const pcac = getPcacInfo();
    if (pcac) {
      items.push({ icon: zfIcon, text: pcac, link: getPcacLink() });
    }
    const icpPlus = getIcpPlusInfo();
    if (icpPlus) {
      items.push({ icon: zzIcon, text: icpPlus, link: getIcpPlusLink() });
    }
    return items;
  });

  const hasContact = computed(() => !!(phone.value || email.value || wechat.value));
</script>

<template>
  <div v-if="visible" class="website-footer">
    <!-- 联系方式: 有字段才显示 -->
    <div v-if="hasContact" class="website-footer__contact">
      <span v-if="phone">
        {{ $t('system.platform.website.footerPhone') }}
        {{ phone }}
      </span>
      <span v-if="email">
        {{ $t('system.platform.website.footerEmail') }}
        <a :href="`mailto:${email}`" class="website-footer__link">{{ email }}</a>
      </span>
      <span v-if="wechat">
        {{ $t('system.platform.website.footerWechat') }}
        {{ wechat }}
      </span>
    </div>

    <!-- 版权 -->
    <div v-if="copyright" class="website-footer__copyright">
      Copyright © {{ year }}
      <span class="website-footer__brand">{{ copyright }}</span>
    </div>

    <!-- 备案行: 对齐商业版 LoginModern -->
    <div v-if="filings.length" class="website-footer__filings">
      <a
        v-for="item in filings"
        :key="item.text"
        class="website-footer__filing"
        :href="item.link || 'javascript:void(0)'"
        :target="item.link ? '_blank' : undefined"
        rel="noopener noreferrer"
      >
        <img :src="item.icon" alt="" class="website-footer__filing-icon" />
        <span>{{ item.text }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
  .website-footer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .website-footer__contact {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    justify-content: center;
  }

  .website-footer__copyright {
    text-align: center;
  }

  .website-footer__brand {
    margin-left: 4px;
  }

  .website-footer__link {
    color: inherit;
  }

  .website-footer__link:hover {
    color: hsl(var(--primary));
  }

  .website-footer__filings {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    justify-content: center;
  }

  .website-footer__filing {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    color: inherit;
    text-decoration: none;
  }

  .website-footer__filing:hover {
    color: hsl(var(--primary));
  }

  .website-footer__filing-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }
</style>
