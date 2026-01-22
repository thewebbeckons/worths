export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
      secondary: "purple",
      neutral: "zinc",
    },
    navigationMenu: {
      slots: {
        link: "text-base font-semibold",
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
          class: { link: "before:bg-primary/10" },
        },
      ],
    },
    dashboardPanel: {
      slots: {
        body: "bg-elevated/50",
      },
    },
    card: {
      slots: {
        root: "rounded-2xl",
      },
    },
  },
});
