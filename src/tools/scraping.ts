import axios from 'axios';
import * as cheerio from 'cheerio';
import { DynamicTool } from '@langchain/core/tools';
import { SCRAPING_CONFIG } from '../config';

/**
 * 从URL获取HTML内容
 */
async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: SCRAPING_CONFIG.timeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw new Error(`Failed to fetch ${url}: ${(error as Error).message}`);
  }
}

/**
 * 从HTML提取主要内容
 */
function extractContent(html: string, includeLinks: boolean, includeImages: boolean): string {
  const $ = cheerio.load(html);

  // 移除不需要的元素
  $('script, style, iframe, nav, footer, .sidebar, .menu, .ad, .advertisement, .banner, .popup').remove();

  // // 如果不包括链接，移除所有链接但保留文本
  // if (!includeLinks) {
  //   $('a').replaceWith(function(this: cheerio.Element) {
  //     return $(this).text();
  //   });
  // }

  // 如果不包括图片，移除所有图片
  if (!includeImages) {
    $('img').remove();
  } else {
    // 将图片转换为 markdown 格式
    $('img').each(function() {
      const alt = $(this).attr('alt') || '';
      const src = $(this).attr('src') || '';
      if (src) {
        $(this).replaceWith(`![${alt}](${src})`);
      } else {
        $(this).remove();
      }
    });
  }

  // 查找主要内容元素
  const mainContent =
    $('main, article, .content, .post, .article, .post-content, .article-content').first().html() ||
    $('body').html() ||
    '';

  // 清理HTML，保留基本格式
  let content = '';
  if (mainContent) {
    // 替换常见HTML元素为Markdown
    content = mainContent
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, '') // 移除其余标签
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n') // 删除多余空行
      .trim();
  }

  return content;
}

/**
 * 从URL抓取内容
 */
export async function scrapeUrl(url: string): Promise<string> {
  try {
    const html = await fetchHtml(url);
    return extractContent(html, SCRAPING_CONFIG.includeLinks, SCRAPING_CONFIG.includeImages);
  } catch (error) {
    throw new Error(`Scraping failed: ${(error as Error).message}`);
  }
}

/**
 * LangChain网页抓取工具
 */
export const scrapingTool = new DynamicTool({
  name: 'webpage_content',
  description: '从网页URL获取文本内容。输入应该是一个有效的URL。',
  func: async (url: string) => {
    try {
      const content = await scrapeUrl(url);
      if (!content || content.trim() === '') {
        return '无法提取页面内容。可能是页面为空，或者内容被JavaScript动态加载。';
      }
      return content;
    } catch (error) {
      return `抓取失败: ${(error as Error).message}`;
    }
  },
}); 