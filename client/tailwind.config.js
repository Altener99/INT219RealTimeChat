/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/*.jsx"
  ],
  theme: {
    extend: {},
  },
  plugins: [
     function ({addUtilities})
     {
        const newUtilities = {

          ".scrollbar-webkit": {
            
            "&::-webkit-scrollbar": {
              display: 'none',
            },
          },

          ".scrollbar-chat": {
              
              "&::-webkit-scrollbar": {
                width: '15px',
              },

              "&::-webkit-scrollbar-track": {
                background: 'rgb(239 246 255 / var(--tw-bg-opacity))',

              },

              "&::-webkit-scrollbar-thumb": {
                background: 'rgb(156 163 175 / var(--tw-bg-opacity))',
                borderRadius: '10px',
                border: '5px solid rgb(239 246 255 / var(--tw-bg-opacity))',
                
              },


          }

        }
        addUtilities(newUtilities, ['responsive', 'hover']);
     }
  ],
}

