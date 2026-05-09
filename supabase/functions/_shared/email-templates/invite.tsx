/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Você foi convidado!</Heading>
        <Text style={text}>
          Você recebeu um convite para entrar no{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Clique no botão abaixo para aceitar e criar sua conta.
        </Text>
        <Button style={button} href={confirmationUrl}>Aceitar convite</Button>
        <Text style={footer}>
          Se você não esperava este convite, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0d0d0d', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#12c28a', textDecoration: 'underline' }
const button = {
  backgroundColor: '#12c28a', color: '#0d0d0d', fontSize: '15px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 24px',
  textDecoration: 'none', display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', lineHeight: '1.5' }
