import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/solid-router'
import { HydrationScript } from 'solid-js/web'
import { Suspense } from 'solid-js'

import styleCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
      },
      { name: 'theme-color', content: '#0a0a1a' },
    ],
    links: [{ rel: 'stylesheet', href: styleCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html>
      <head>
        <HydrationScript />
      </head>
      <body>
        <div class="cosmos-grid" />
        {/* 星星背景 */}
        <div class="fixed inset-0 pointer-events-none z-0">
          <div
            class="star"
            style={{ top: '10%', left: '20%', 'animation-delay': '0s' }}
          />
          <div
            class="star"
            style={{ top: '30%', left: '80%', 'animation-delay': '1s' }}
          />
          <div
            class="star"
            style={{ top: '50%', left: '10%', 'animation-delay': '2s' }}
          />
          <div
            class="star"
            style={{ top: '70%', left: '60%', 'animation-delay': '0.5s' }}
          />
          <div
            class="star"
            style={{ top: '20%', left: '50%', 'animation-delay': '1.5s' }}
          />
          <div
            class="star"
            style={{ top: '80%', left: '30%', 'animation-delay': '2.5s' }}
          />
        </div>

        <HeadContent />
        <Suspense>
          <Outlet />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
