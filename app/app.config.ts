export default defineAppConfig({
  ui: {
    colors: {
      primary: "coral",
      secondary: "sage",
      neutral: "stone",
    },
    navigationMenu: {
      slots: {
        link: "text-sm font-semibold rounded-full px-4",
      },
      variants: {
        orientation: {
          vertical: {
            link: "py-3",
          },
        },
      },
      compoundVariants: [
        {
          variant: "pill",
          active: true,
          highlight: false,
          class: { link: "before:bg-primary/10 text-highlighted" },
        },
      ],
    },
    dashboardPanel: {
      slots: {
        body: "bg-transparent",
      },
    },
    card: {
      slots: {
        root: "soft-card rounded-[1.35rem]",
        header: "border-b-0 pb-2",
      },
    },
    button: {
      slots: {
        base: "rounded-full font-semibold",
      },
    },
    input: {
      slots: {
        root: "rounded-xl",
      },
    },
    modal: {
      slots: {
        content: "rounded-[1.5rem]",
      },
    },
  },
});
