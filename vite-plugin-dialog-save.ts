import type { Plugin } from 'vite'
import { writeFile } from 'fs/promises'
import { resolve } from 'path'

/**
 * Vite plugin to add API endpoint for saving dialog trees
 * Handles POST requests to /api/save-dialog-tree
 */
export function dialogSavePlugin(): Plugin {
  return {
    name: 'dialog-save-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-dialog-tree', async (req, res) => {
        // Only allow POST requests
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        // Parse request body
        let body = ''
        req.on('data', (chunk) => {
          body += chunk.toString()
        })

        req.on('end', async () => {
          try {
            const { treeId, content } = JSON.parse(body)

            if (!treeId || !content) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing treeId or content' }))
              return
            }

            // Validate treeId to prevent directory traversal
            if (treeId.includes('/') || treeId.includes('\\') || treeId.includes('..')) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid treeId' }))
              return
            }

            // Validate content is valid JSON
            try {
              JSON.parse(content)
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON content' }))
              return
            }

            // Write file to disk
            const filePath = resolve(
              process.cwd(),
              'src/content/dialog-trees',
              `${treeId}.json`
            )

            await writeFile(filePath, content, 'utf-8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                success: true,
                message: `Saved ${treeId}.json`,
                path: filePath,
              })
            )
          } catch (error) {
            console.error('Error saving dialog tree:', error)
            res.statusCode = 500
            res.end(
              JSON.stringify({
                error: 'Failed to save file',
                details: error instanceof Error ? error.message : 'Unknown error',
              })
            )
          }
        })
      })
    },
  }
}
