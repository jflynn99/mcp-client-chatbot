"use client";

import { appStore } from "@/app/store";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import { CheckIcon, ChevronDown } from "lucide-react";
import { Fragment, memo, PropsWithChildren, useEffect, useState } from "react";
import { Button } from "ui/button";
import { ClaudeIcon } from "ui/claude-icon";
import { getModelMetadata } from "lib/ai/model-metadata";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { GeminiIcon } from "ui/gemini-icon";
import { GrokIcon } from "ui/grok-icon";
import { OpenAIIcon } from "ui/openai-icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

interface SelectModelProps {
  onSelect: (model: ChatModel) => void;
  align?: "start" | "end";
  defaultModel?: ChatModel;
}

export const SelectModel = (props: PropsWithChildren<SelectModelProps>) => {
  const [open, setOpen] = useState(false);
  const { data: providers } = useChatModels();
  const [model, setModel] = useState(props.defaultModel);

  useEffect(() => {
    setModel(props.defaultModel ?? appStore.getState().chatModel);
  }, [props.defaultModel]);

  const selectedModelMetadata = model
    ? getModelMetadata(model.provider, model.model)
    : undefined;
  const selectedModelDisplayName =
    selectedModelMetadata?.displayName || model?.model;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {props.children || (
          <Button
            variant={"secondary"}
            size={"sm"}
            className="data-[state=open]:bg-input! hover:bg-input! "
          >
            <p className="mr-auto">
              {selectedModelDisplayName ?? (
                <span className="text-muted-foreground">model</span>
              )}
            </p>
            <ChevronDown className="size-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px]" align={props.align || "end"}>
        <Command
          className="rounded-lg relative shadow-md h-80"
          value={JSON.stringify(model)}
          onClick={(e) => e.stopPropagation()}
        >
          <CommandInput placeholder="search model..." />
          <CommandList className="p-2">
            <CommandEmpty>No results found.</CommandEmpty>
            {providers?.map((provider, i) => (
              <Fragment key={provider.provider}>
                <CommandGroup
                  heading={<ProviderHeader provider={provider.provider} />}
                  className="pb-4 group"
                  onWheel={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {provider.models.map((item) => {
                    const metadata = getModelMetadata(
                      provider.provider,
                      item.name,
                    );
                    const displayName = metadata?.displayName || item.name;
                    return (
                      <CommandItem
                        key={item.name}
                        className="cursor-pointer"
                        onSelect={() => {
                          setModel({
                            provider: provider.provider,
                            model: item.name,
                          });
                          props.onSelect({
                            provider: provider.provider,
                            model: item.name,
                          });
                          setOpen(false);
                        }}
                        value={item.name}
                      >
                        {model?.provider === provider.provider &&
                        model?.model === item.name ? (
                          <CheckIcon className="size-3" />
                        ) : (
                          <div className="ml-3" />
                        )}
                        <span className="pr-2">{displayName}</span>
                        <div className="ml-auto flex items-center gap-1">
                          {metadata?.badge && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {metadata.badge}
                            </span>
                          )}
                          {item.isToolCallUnsupported && (
                            <span className="text-xs text-muted-foreground">
                              No tools
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {i < providers?.length - 1 && <CommandSeparator />}
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ProviderHeader = memo(function ProviderHeader({
  provider,
}: { provider: string }) {
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors duration-300">
      {provider === "openai" ? (
        <OpenAIIcon className="size-3 text-foreground" />
      ) : provider === "xai" ? (
        <GrokIcon className="size-3" />
      ) : provider === "anthropic" ? (
        <ClaudeIcon className="size-3" />
      ) : provider === "google" ? (
        <GeminiIcon className="size-3" />
      ) : null}
      {provider}
    </div>
  );
});
