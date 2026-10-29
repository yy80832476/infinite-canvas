import { Button, Drawer, Input, Segmented, Select, Space } from "antd";
import { ListPlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { defaultBaseUrlForApiFormat, guessCapability, normalizeChannelModels, type ApiCallFormat, type ChannelModel, type ModelCapability, type ModelChannel } from "@/stores/use-config-store";
import { PRODUCT_FEATURES } from "@/constant/product-lock";
import { ModelScriptEditor } from "./model-script-editor";
import { ModelSelectModal } from "./model-select-modal";

type ScriptTarget = { name: string; capability: ModelCapability; value: string };

/**
 * 渠道编辑抽屉。
 *
 * 站点锁定时只允许填写 API Key：渠道名称、协议、接口地址和模型列表均由站点固定，
 * 避免用户把请求改到其它中转地址。
 */
export function ChannelEditorDrawer({ open, channel, onSave, onClose }: { open: boolean; channel: ModelChannel | null; onSave: (channel: ModelChannel) => void; onClose: () => void }) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState<ModelChannel | null>(channel);
    const [selectOpen, setSelectOpen] = useState(false);
    const [scriptTarget, setScriptTarget] = useState<ScriptTarget | null>(null);
    const locked = !PRODUCT_FEATURES.channelEditing;
    const apiFormatOptions: Array<{ label: string; value: ApiCallFormat }> = [
        { label: "OpenAI", value: "openai" },
        { label: "Gemini", value: "gemini" },
    ];
    // 只展示当前部署启用的能力，避免把模型标成不可用的视频/音频。
    const capabilityOptions: Array<{ label: string; value: ModelCapability }> = (["image", "video", "text", "audio"] as ModelCapability[])
        .filter((value) => (value === "video" ? PRODUCT_FEATURES.video : value === "audio" ? PRODUCT_FEATURES.audio : true))
        .map((value) => ({ label: t(`config.channelEditor.capabilities.${value}`), value }));

    useEffect(() => {
        if (open && channel) setDraft(channel);
    }, [open, channel]);

    if (!draft) return null;

    const patch = (value: Partial<ModelChannel>) => setDraft((current) => (current ? { ...current, ...value } : current));
    const setModels = (models: ChannelModel[]) => patch({ models });

    const changeApiFormat = (apiFormat: ApiCallFormat) => {
        const baseUrl = !draft.baseUrl.trim() || draft.baseUrl.trim() === defaultBaseUrlForApiFormat(draft.apiFormat) ? defaultBaseUrlForApiFormat(apiFormat) : draft.baseUrl;
        patch({ apiFormat, baseUrl });
    };

    const applySelection = (names: string[]) => {
        const map = new Map(draft.models.map((model) => [model.name, model]));
        setModels(names.map((name) => map.get(name) || { name, capability: guessCapability(name) }));
    };

    const setCapability = (name: string, capability: ModelCapability) => setModels(draft.models.map((model) => (model.name === name ? { ...model, capability } : model)));
    const setScript = (name: string, script: string) => setModels(draft.models.map((model) => (model.name === name ? { ...model, script: script || undefined } : model)));
    const removeModel = (name: string) => setModels(draft.models.filter((model) => model.name !== name));

    const save = () => {
        // 锁定模式下只提交 API Key，其余字段始终以当前渠道配置为准。
        onSave({ ...draft, name: draft.name.trim() || t("config.channels.unnamed"), models: normalizeChannelModels(draft.models) });
        onClose();
    };

    // 模型列表允许用户自行维护（新增 / 修改能力 / 删除），渠道地址与协议仍然锁定。
    const modelsSection = (
        <>
            <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold">{t("config.channelEditor.models")}</div>
                    <div className="mt-0.5 text-xs text-stone-500">{t("config.channelEditor.modelDescription", { count: draft.models.length })}</div>
                </div>
                <Button type="primary" icon={<ListPlus className="size-4" />} onClick={() => setSelectOpen(true)}>
                    {t("config.channelEditor.selectModels")}
                </Button>
            </div>

            <div className="space-y-2 rounded-lg border border-stone-200 p-2 dark:border-stone-800">
                {draft.models.length ? (
                    draft.models.map((model) => (
                        <div key={model.name} className="flex flex-wrap items-center gap-3 rounded-md px-2 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-900/40">
                            <span className="min-w-0 flex-1 truncate text-sm" title={model.name}>
                                {model.name}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                                <Segmented size="small" value={model.capability} options={capabilityOptions} onChange={(value) => setCapability(model.name, value as ModelCapability)} />
                                <Button size="small" type={model.script ? "primary" : "default"} ghost={Boolean(model.script)} onClick={() => setScriptTarget({ name: model.name, capability: model.capability, value: model.script || "" })}>
                                    {t(model.script ? "config.channelEditor.scriptReady" : "config.channelEditor.script")}
                                </Button>
                                <Button size="small" danger type="text" icon={<Trash2 className="size-3.5" />} onClick={() => removeModel(model.name)} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-2 py-8 text-center text-sm text-stone-500">{t("config.channelEditor.empty")}</div>
                )}
            </div>

            <ModelSelectModal open={selectOpen} channel={draft} selectedNames={draft.models.map((model) => model.name)} onConfirm={applySelection} onClose={() => setSelectOpen(false)} />

            <ModelScriptEditor
                open={Boolean(scriptTarget)}
                capability={scriptTarget?.capability || "text"}
                modelName={scriptTarget?.name || ""}
                value={scriptTarget?.value || ""}
                onSave={(script) => scriptTarget && setScript(scriptTarget.name, script)}
                onClose={() => setScriptTarget(null)}
            />
        </>
    );

    return (
        <Drawer
            open={open}
            width={640}
            title={t(locked ? "config.channelEditor.lockedTitle" : "config.channelEditor.title")}
            onClose={onClose}
            styles={{ body: { paddingTop: 16 } }}
            extra={
                <Space>
                    <Button onClick={onClose}>{t("common.cancel")}</Button>
                    <Button type="primary" onClick={save}>
                        {t("common.save")}
                    </Button>
                </Space>
            }
        >
            {locked ? (
                <div className="space-y-4">
                    <div className="rounded-lg border border-stone-200 px-4 py-3 text-sm dark:border-stone-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-stone-500">{t("config.channelEditor.name")}</span>
                            <span className="font-medium">{draft.name}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-stone-500">{t("config.channelEditor.protocol")}</span>
                            <span className="font-medium">{draft.apiFormat === "gemini" ? "Gemini" : "OpenAI"}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="shrink-0 text-stone-500">{t("config.channelEditor.baseUrl")}</span>
                            <span className="min-w-0 break-all text-right font-medium">{draft.baseUrl}</span>
                        </div>
                    </div>
                    <div className="text-xs text-stone-500">{t("config.channels.lockedDescription")}</div>
                    <label className="block">
                        <span className="mb-1 block text-sm font-medium">API Key</span>
                        <Input.Password value={draft.apiKey} onChange={(event) => patch({ apiKey: event.target.value })} placeholder="sk-..." />
                    </label>
                    {modelsSection}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">{t("config.channelEditor.name")}</span>
                            <Input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">{t("config.channelEditor.protocol")}</span>
                            <Select className="w-full" value={draft.apiFormat} options={apiFormatOptions} onChange={changeApiFormat} />
                        </label>
                        <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-medium">{t("config.channelEditor.baseUrl")}</span>
                            <Input value={draft.baseUrl} onChange={(event) => patch({ baseUrl: event.target.value })} placeholder="https://api.example.com" />
                        </label>
                        <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-medium">API Key</span>
                            <Input.Password value={draft.apiKey} onChange={(event) => patch({ apiKey: event.target.value })} placeholder="sk-..." />
                        </label>
                    </div>

                    {modelsSection}
                </>
            )}
        </Drawer>
    );
}
