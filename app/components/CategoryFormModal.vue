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
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: "",
  type: "asset",
});

// Reset/populate form when modal opens or category changes
watch(
  () => [props.open, props.category],
  () => {
    if (props.open) {
      if (props.category) {
        state.name = props.category.name;
        state.type = props.category.type;
      } else {
        state.name = "";
        state.type = "asset";
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
      await updateCategory(props.category.id, event.data.name, event.data.type);
      toast.add({ title: "Category updated", color: "success" });
    } else {
      await addCategory(event.data.name, event.data.type);
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
