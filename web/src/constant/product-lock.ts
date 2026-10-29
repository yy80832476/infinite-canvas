import type { ChannelModel } from "@/stores/use-config-store";

/**
 * 站点级锁定配置。
 *
 * 本部署只开放「画布 + 生图」，并锁定渠道地址，避免用户把请求改到其它中转服务。
 * 如需恢复完整功能，把 PRODUCT_FEATURES 中对应开关改为 true 即可；渠道地址如需放开，
 * 去掉 use-config-store 中 merge 的强制覆盖逻辑即可。
 */

/** 固定渠道 ID：用作用户模型选择值的命名空间（yuontop::模型名）。 */
export const LOCKED_CHANNEL_ID = "yuontop";

/** 固定渠道名称，界面上只读展示。 */
export const LOCKED_CHANNEL_NAME = "yuontop";

/** 固定接口地址，通过 nginx 同源反代到中转服务。 */
export const LOCKED_CHANNEL_BASE_URL = "https://canvas.yuontop.dpdns.org/relay";

/** 固定协议：中转服务兼容 OpenAI 协议。 */
export const LOCKED_CHANNEL_API_FORMAT = "openai" as const;

/** 固定模型列表及能力划分：图片模型用于生图，其余用于文本类节点。 */
export const LOCKED_CHANNEL_MODELS: ChannelModel[] = [
    { name: "gpt-image-2", capability: "image" },
    { name: "gpt-5.6-sol", capability: "text" },
    { name: "gpt-6-astra", capability: "text" },
    { name: "gpt-6.1-sol", capability: "text" },
    { name: "gpt-image-2.5", capability: "image" },
    { name: "gpt-image-2.5-sunburst", capability: "image" },
];

/** 默认生图模型。 */
export const LOCKED_DEFAULT_IMAGE_MODEL = "gpt-image-2";

/** 默认文本模型（反推提示词、文本节点生成使用）。 */
export const LOCKED_DEFAULT_TEXT_MODEL = "gpt-5.6-sol";

/**
 * 渠道模型集合的版本号。
 *
 * 老浏览器里的配置没有这个字段，加载时会重置为上面的默认模型；用户之后自行
 * 增删改的模型会连同该版本号一起持久化，不会被再次覆盖。
 */
export const CHANNEL_SCHEMA_VERSION = 1;

/**
 * 功能开关。
 * 关闭的功能不仅隐藏入口，相关配置项也不会再被持久化配置覆盖回来。
 */
export const PRODUCT_FEATURES = {
    /** 视频创作台 / 视频节点 / 视频配置。 */
    video: false,
    /** 画布音频节点与音频相关配置。 */
    audio: false,
    /** 画布顶栏的「配置」入口。 */
    canvasConfig: false,
    /** 渠道名称 / 协议 / 接口地址 / 模型列表是否可编辑。 */
    channelEditing: false,
    /** 节点插件（第三方 JS 插件）入口。 */
    plugins: false,
    /** 本地代理（绕过 CORS 的本机转发服务）入口。 */
    localProxy: false,
    /** 提示词来源配置。 */
    promptSources: false,
    /** 配置文件导入 / 导出。 */
    importExport: false,
    /** 右上角文档入口。 */
    docs: false,
    /** 右上角版本发布信息入口。 */
    version: false,
    /** 右上角 GitHub 入口。 */
    github: false,
} as const;
