<script setup lang="ts">
import { h, resolveComponent } from "vue";

const { accounts, updateBalance, deleteAccount, getBalanceHistory } =
  useNetWorth();

type AccountRow = {
  id: string;
  name: string;
  bank: string;
  category: string;
  owner: string;
  ownerColor?: string;
  type: "asset" | "liability";
  balance: number;
  monthlyChange: number;
  notes?: string;
};

type EditableAccount = {
  id: string;
  name: string;
  bank: string;
  category: string;
  owner: string;
  type: "asset" | "liability";
  latestBalance: number;
  notes?: string;
};

type SortDirection = "asc" | "desc" | false;

type SortColumn = {
  getIsSorted: () => SortDirection;
  toggleSorting: (desc: boolean) => void;
};

// Props for filter values (controlled by parent)
const props = defineProps<{
  searchQuery?: string;
  categoryFilter?: string[];
  ownerFilter?: string[];
  bankFilter?: string[];
}>();

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

// Helper to format change with sign
const formatChange = (value: number) => {
  const formatted = formatCurrency(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "bank", header: "Bank" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "owner", header: "Owner" },
  {
    accessorKey: "balance",
    header: ({ column }: { column: SortColumn }) => {
      const isSorted = column.getIsSorted();
      return h(resolveComponent("UButton"), {
        color: "neutral",
        variant: "ghost",
        label: "Current Balance",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
  },
  { accessorKey: "monthlyChange", header: "MoM Change" },
  { id: "actions" },
];

const sorting = ref([]);

// Store previous month balances per account
const previousMonthBalances = ref<Record<string, number>>({});

// Load previous month balances for all accounts
const loadPreviousMonthBalances = async () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate previous month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const balances: Record<string, number> = {};

  for (const acc of accounts.value) {
    try {
      const history = await getBalanceHistory(acc.id);
      // Find the most recent balance from previous month or earlier
      const prevMonthBalance = history
        .filter((entry) => {
          const entryDate = new Date(entry.date);
          // Entry is from previous month or earlier
          return (
            entryDate.getFullYear() < prevYear ||
            (entryDate.getFullYear() === prevYear &&
              entryDate.getMonth() <= prevMonth)
          );
        })
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

      balances[acc.id] = prevMonthBalance?.value ?? 0;
    } catch {
      balances[acc.id] = 0;
    }
  }

  previousMonthBalances.value = balances;
};

// Load balances when accounts change
watch(
  accounts,
  () => {
    loadPreviousMonthBalances();
  },
  { immediate: true }
);

const items = computed<AccountRow[]>(() => {
  return accounts.value.map((acc) => {
    const prevBalance = previousMonthBalances.value[acc.id] ?? 0;
    return {
      id: acc.id,
      name: acc.name,
      bank: acc.bank,
      category: acc.category,
      owner: acc.owner,
      ownerColor: acc.ownerColor,
      type: acc.type,
      balance: acc.latestBalance,
      monthlyChange: acc.latestBalance - prevBalance,
      notes: acc.notes,
    };
  });
});

// Apply filters from props
const filteredItems = computed(() => {
  return items.value.filter((item) => {
    // Search filter (name or bank)
    if (props.searchQuery) {
      const query = props.searchQuery.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesBank = item.bank.toLowerCase().includes(query);
      if (!matchesName && !matchesBank) return false;
    }
    // Dropdown filters
    if (
      props.categoryFilter &&
      props.categoryFilter.length > 0 &&
      !props.categoryFilter.includes(item.category)
    )
      return false;
    if (
      props.ownerFilter &&
      props.ownerFilter.length > 0 &&
      !props.ownerFilter.includes(item.owner)
    )
      return false;
    if (
      props.bankFilter &&
      props.bankFilter.length > 0 &&
      !props.bankFilter.includes(item.bank)
    )
      return false;
    return true;
  });
});

// Metrics computed properties
const totalAccountsCount = computed(() => items.value.length);
const filteredAccountsCount = computed(() => filteredItems.value.length);
const filteredAccountsTotal = computed(() => {
  return filteredItems.value.reduce((sum, item) => {
    // Subtract liabilities from the total
    if (item.type === "liability") {
      return sum - item.balance;
    }
    return sum + item.balance;
  }, 0);
});

// State for inline balance editing
const editingAccountId = ref<string | null>(null);
const editingBalance = ref(0);
const isSaving = ref(false);

const startEditing = (row: AccountRow) => {
  editingAccountId.value = row.id;
  editingBalance.value = row.balance;
};

const saveInlineBalance = async () => {
  if (!editingAccountId.value) return;

  isSaving.value = true;
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await updateBalance(editingAccountId.value, editingBalance.value, dateStr);
  } finally {
    isSaving.value = false;
    editingAccountId.value = null;
  }
};

const cancelEditing = () => {
  editingAccountId.value = null;
};

// State for editing account
const isEditModalOpen = ref(false);
const accountToEdit = ref<EditableAccount | null>(null);

const openEditModal = (row: AccountRow) => {
  accountToEdit.value = {
    id: row.id,
    name: row.name,
    bank: row.bank,
    category: row.category,
    owner: row.owner,
    type: row.type,
    latestBalance: row.balance,
    notes: row.notes,
  };
  isEditModalOpen.value = true;
};

// State for delete confirmation
const isDeleteModalOpen = ref(false);
const accountToDelete = ref<AccountRow | null>(null);

const openDeleteModal = (row: AccountRow) => {
  accountToDelete.value = row;
  isDeleteModalOpen.value = true;
};

const confirmDelete = async () => {
  if (accountToDelete.value) {
    await deleteAccount(accountToDelete.value.id);
    isDeleteModalOpen.value = false;
    accountToDelete.value = null;
  }
};

// Dropdown menu items generator
const getDropdownItems = (row: AccountRow) => [
  [
    {
      label: "Edit Account",
      icon: "i-lucide-pencil",
      onClick: () => openEditModal(row),
    },
    {
      label: "View History",
      icon: "i-lucide-chart-no-axes-combined",
      to: `/accounts/${row.id}`,
    },
  ],
  [
    {
      label: "Delete Account",
      icon: "i-lucide-trash-2",
      color: "error" as const,
      onClick: () => openDeleteModal(row),
    },
  ],
];
</script>

<template>
  <div class="space-y-4">
    <!-- Metrics Bar -->
    <div class="flex items-center justify-between text-sm">
      <span class="text-muted">
        Showing
        <span class="font-medium text-default">{{
          filteredAccountsCount
        }}</span>
        out of
        <span class="font-medium text-default">{{ totalAccountsCount }}</span>
        accounts
      </span>
      <span class="font-medium">
        Accounts Total:
        <span
          :class="filteredAccountsTotal < 0 ? 'text-error' : 'text-primary'"
          >{{ formatCurrency(filteredAccountsTotal) }}</span
        >
      </span>
    </div>

    <UTable v-model:sorting="sorting" :columns="columns" :data="filteredItems">
      <template #owner-cell="{ row }">
        <div class="flex items-center gap-2">
          <OwnerBadge
            :name="row.original.owner"
            :color="row.original.ownerColor"
            size="xs"
          />
        </div>
      </template>

      <template #balance-cell="{ row }">
        <div class="flex items-center gap-2">
          <!-- Editing mode -->
          <template v-if="editingAccountId === row.original.id">
            <UInputNumber
              v-model="editingBalance"
              :format-options="{ style: 'currency', currency: 'USD' }"
              :step="0.01"
              size="sm"
              class="w-32"
              :disabled="isSaving"
              @blur="saveInlineBalance"
              @keyup.enter="saveInlineBalance"
              @keyup.escape="cancelEditing"
              autofocus
            />
            <UButton
              v-if="isSaving"
              icon="i-lucide-loader-2"
              color="neutral"
              variant="ghost"
              size="xs"
              class="animate-spin"
              disabled
            />
          </template>
          <!-- Display mode -->
          <template v-else>
            <span
              :class="
                (row.original.type === 'liability' &&
                  row.original.balance > 0) ||
                (row.original.type !== 'liability' && row.original.balance < 0)
                  ? 'text-error'
                  : 'text-primary'
              "
              class="cursor-pointer hover:underline"
              @click="startEditing(row.original)"
            >
              {{ formatCurrency(row.original.balance) }}
            </span>
            <UButton
              icon="i-lucide-pencil-line"
              color="neutral"
              variant="ghost"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click="startEditing(row.original)"
            />
          </template>
        </div>
      </template>

      <template #monthlyChange-cell="{ row }">
        <div class="flex items-center gap-1">
          <UIcon
            v-if="row.original.monthlyChange !== 0"
            :name="
              row.original.monthlyChange > 0
                ? 'i-lucide-trending-up'
                : 'i-lucide-trending-down'
            "
            :class="
              row.original.monthlyChange > 0 ? 'text-success' : 'text-error'
            "
            class="size-4"
          />
          <span
            :class="[
              row.original.monthlyChange > 0 ? 'text-success' : '',
              row.original.monthlyChange < 0 ? 'text-error' : '',
              row.original.monthlyChange === 0 ? 'text-muted' : '',
            ]"
          >
            {{ formatChange(row.original.monthlyChange) }}
          </span>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UDropdownMenu :items="getDropdownItems(row.original)">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              class="cursor-pointer"
            />
          </UDropdownMenu>
        </div>
      </template>
    </UTable>

    <!-- Edit Account Modal -->
    <UModal v-model:open="isEditModalOpen" title="Edit Account">
      <template #body>
        <EditAccountForm
          v-if="accountToEdit"
          :account="accountToEdit"
          @close="isEditModalOpen = false"
          @saved="isEditModalOpen = false"
        />
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-4">
          <h3 class="text-lg font-bold mb-4">Delete Account</h3>
          <p class="mb-4">
            Are you sure you want to delete
            <strong>{{ accountToDelete?.name }}</strong
            >? This action cannot be undone and will remove all balance history
            for this account.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="isDeleteModalOpen = false"
            />
            <UButton label="Delete" color="error" @click="confirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
