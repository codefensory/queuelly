import { ButtonHTMLAttributes, PropsWithChildren } from "react"

export const BlueButton = (
  props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>,
) => {
  const { children, ...rest } = props

  return (
    <button
      {...rest}
      className="transition-background inline-flex h-8 items-center justify-center rounded-md border border-gray-800 bg-gradient-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] bg-[length:200%_200%] bg-[0%_0%] px-4 font-medium text-gray-950 duration-500 hover:bg-[100%_200%] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50"
    >
      {children}
    </button>
  )
}

export const RedButton = (
  props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>,
) => {
  const { children, ...rest } = props

  return (
    <button
      {...rest}
      className="transition-background inline-flex h-8 items-center justify-center rounded-md border border-gray-800 bg-gradient-to-r from-gray-100 via-red-200 to-red-400 bg-[length:200%_200%] bg-[0%_0%] px-4 font-medium text-gray-950 duration-500 hover:bg-[100%_200%] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50"
    >
      {children}
    </button>
  )
}
