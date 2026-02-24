import type { Plugin } from 'vite'
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

interface ObjectiveData {
  id: string
  title: string
  description: string
  status: 'active' | 'hidden' | 'completed'
  category: 'main' | 'secondary'
  order: number
  targetLocation?: string
  currentProgress?: number
  maxProgress?: number
  discoveryConditions?: Array<{
    type: string
    id?: string
    description?: string
  }>
  subtasks?: Array<{
    id: string
    description: string
    completed: boolean
    featureId?: string
  }>
}

interface ObjectivesConfig {
  objectives: ObjectiveData[]
}

/**
 * Vite plugin to add API endpoint for saving objectives
 * Handles POST requests to /api/dev/save-objectives
 */
export function objectivesSavePlugin(): Plugin {
  return {
    name: 'objectives-save-plugin',
    configureServer(server) {
      server.middlewares.use('/api/dev/save-objectives', async (req, res) => {
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
            const { changes } = JSON.parse(body) as {
              changes: Record<string, Partial<ObjectiveData>>
            }

            if (!changes || Object.keys(changes).length === 0) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'No changes provided' }))
              return
            }

            // Read current objectives.json
            const filePath = resolve(process.cwd(), 'src/config/objectives.json')
            const fileContent = await readFile(filePath, 'utf-8')
            const config: ObjectivesConfig = JSON.parse(fileContent)

            // Apply changes to each objective
            for (const [objectiveId, objectiveChanges] of Object.entries(changes)) {
              const objective = config.objectives.find((o) => o.id === objectiveId)
              if (objective) {
                // Merge changes into the objective
                Object.assign(objective, objectiveChanges)
              } else {
                console.warn(`Objective not found: ${objectiveId}`)
              }
            }

            // Format JSON with 2-space indentation for readability
            const updatedContent = JSON.stringify(config, null, 2) + '\n'

            // Write back to file
            await writeFile(filePath, updatedContent, 'utf-8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                success: true,
                message: `Updated ${Object.keys(changes).length} objective(s)`,
                updatedIds: Object.keys(changes),
              })
            )
          } catch (error) {
            console.error('Error saving objectives:', error)
            res.statusCode = 500
            res.end(
              JSON.stringify({
                error: 'Failed to save objectives',
                details: error instanceof Error ? error.message : 'Unknown error',
              })
            )
          }
        })
      })
    },
  }
}
