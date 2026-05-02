import { StatusPicture } from '@app/components/StatusPicture'

import { config } from '@app/controller/config'
import { Button, Stack, Text } from 'react-figma-ui/ui'

import styles from './styles.module.css'

interface EmptyViewProps {
  setFileHasVariables: (value: boolean) => void
}

export const EmptyView = ({ setFileHasVariables }: EmptyViewProps) => {
  return (
    <section className={styles.emptyView}>
      <Stack gap={8} className={styles.group}>
        <StatusPicture status="error" />
        <Text className={styles.label}>No variables found in the file</Text>
      </Stack>

      <Stack gap={8} className={styles.group}>
        <Button
          className={styles.button}
          label="Continue without variables"
          secondary
          onClick={() => {
            setFileHasVariables(true)
          }}
          fullWidth
        />
        <a
          href={config.docsLink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
          style={{
            margin: '15px',
          }}
        >
          Documentation 📖
        </a>
      </Stack>
    </section>
  )
}
