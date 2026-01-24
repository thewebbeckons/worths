<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";
import type { DbCategory } from "~/types/db";

const props = defineProps<{
  open: boolean;
  category?: DbCategory | null;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "saved"): void;
}>();

const { addCategory, updateCategory } = useDatabase();
const toast = useToast();

const isEditing = computed(() => !!props.category?.id);
const modalTitle = computed(() =>
  isEditing.value ? "Edit Category" : "Add Category"
);

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["asset", "liability"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: "",
  type: "asset",
  icon: undefined,
  color: undefined,
});

// Reset/populate form when modal opens or category changes
watch(
  () => [props.open, props.category],
  () => {
    if (props.open) {
      if (props.category) {
        state.name = props.category.name;
        state.type = props.category.type;
        state.icon = props.category.icon;
        state.color = props.category.color;
      } else {
        state.name = "";
        state.type = "asset";
        state.icon = undefined;
        state.color = undefined;
      }
    }
  },
  { immediate: true }
);

const isSaving = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSaving.value = true;
  try {
    if (isEditing.value && props.category?.id) {
      await updateCategory(props.category.id, event.data.name, event.data.type, event.data.icon, event.data.color);
      toast.add({ title: "Category updated", color: "success" });
    } else {
      await addCategory(event.data.name, event.data.type, event.data.icon, event.data.color);
      toast.add({ title: "Category created", color: "success" });
    }
    emit("saved");
    emit("update:open", false);
  } catch (error) {
    toast.add({ title: "Error", description: String(error), color: "error" });
  } finally {
    isSaving.value = false;
  }
}

const typeOptions = [
  {
    value: "asset",
    label: "Asset",
    description: "Increases net worth (e.g., savings, investments)",
  },
  {
    value: "liability",
    label: "Liability",
    description: "Decreases net worth (e.g., loans, credit cards)",
  },
];

// Icon options
const iconOptions = [
  { value: "lucide-home", label: "Home" },
  { value: "lucide-leaf", label: "Leaf" },
  { value: "lucide-piggy-bank", label: "Piggy Bank" },
  { value: "lucide-wallet", label: "Wallet" },
  { value: "lucide-bitcoin", label: "Bitcoin" },
  { value: "lucide-credit-card", label: "Credit Card" },
  { value: "lucide-trending-up", label: "Trending Up" },
  { value: "lucide-hand-coins", label: "Hand Coins" },
  { value: "lucide-building", label: "Building" },
  { value: "lucide-car", label: "Car" },
  { value: "lucide-dollar-sign", label: "Dollar Sign" },
];

// Color options (Nuxt UI semantic colors)
const colorOptions = [
  { value: "primary", label: "Primary (Blue)" },
  { value: "success", label: "Success (Green)" },
  { value: "warning", label: "Warning (Orange)" },
  { value: "error", label: "Error (Red)" },
  { value: "info", label: "Info (Cyan)" },
  { value: "secondary", label: "Secondary (Purple)" },
  { value: "neutral", label: "Neutral (Gray)" },
];
</script>

<template>
  <UModal
    :open="open"
    :title="modalTitle"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Category Name" name="name">
          <UInput
            v-model="state.name"
            placeholder="e.g. Retirement, Emergency Fund"
          />
        </UFormField>

        <UFormField label="Type" name="type">
          <URadioGroup v-model="state.type" :items="typeOptions" />
        </UFormField>

        <UFormField label="Icon (Optional)" name="icon">
          <USelect
            v-model="state.icon"
            :items="iconOptions"
            placeholder="Select an icon"
          />
        </UFormField>

        <UFormField label="Color (Optional)" name="color">
          <USelect
            v-model="state.color"
            :items="colorOptions"
            placeholder="Select a color"
          />
        </UFormField>

        <!-- Preview -->
        <div
          v-if="state.icon && state.color"
          class="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
        >
          <div
            class="flex items-center justify-center w-11 h-11 rounded-xl"
            :class="`bg-${state.color}-100 dark:bg-${state.color}-900/20`"
          >
            <UIcon
              :name="state.icon"
              :class="`text-${state.color}-600 dark:text-${state.color}-400`"
              class="w-6 h-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium">Preview</p>
            <p class="text-xs text-neutral-500">How your category will appear</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="emit('update:open', false)"
          />
          <UButton
            type="submit"
            :label="isEditing ? 'Save Changes' : 'Create Category'"
            :loading="isSaving"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
