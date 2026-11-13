USE [ualab]
GO
/****** Object:  Table [dbo].[categories]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[categories](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[description] [nvarchar](max) NULL,
	[slug] [nvarchar](255) NOT NULL,
	[isEnabled] [bit] NOT NULL,
	[sortOrder] [int] NOT NULL,
	[parentId] [int] NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[discounts]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[discounts](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[type] [nvarchar](255) NOT NULL,
	[value] [decimal](10, 2) NOT NULL,
	[isEnabled] [bit] NOT NULL,
	[validFrom] [datetimeoffset](7) NULL,
	[validTo] [datetimeoffset](7) NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[inquiries]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[inquiries](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[phone] [nvarchar](255) NULL,
	[subject] [nvarchar](255) NULL,
	[message] [nvarchar](max) NOT NULL,
	[source] [nvarchar](255) NOT NULL,
	[productId] [int] NULL,
	[productName] [nvarchar](255) NULL,
	[productSku] [nvarchar](255) NULL,
	[variantId] [int] NULL,
	[variantName] [nvarchar](255) NULL,
	[variantSku] [nvarchar](255) NULL,
	[status] [nvarchar](255) NOT NULL,
	[notified] [bit] NOT NULL,
	[readAt] [datetimeoffset](7) NULL,
	[repliedAt] [datetimeoffset](7) NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[product_categories]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[product_categories](
	[productId] [int] NOT NULL,
	[categoryId] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[productId] ASC,
	[categoryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[products]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[products](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[sku] [nvarchar](255) NOT NULL,
	[images] [nvarchar](max) NOT NULL,
	[shortDescription] [nvarchar](max) NULL,
	[longDescription] [nvarchar](max) NULL,
	[price] [decimal](10, 2) NOT NULL,
	[stock] [int] NOT NULL,
	[isEnabled] [bit] NOT NULL,
	[isFeatured] [bit] NOT NULL,
	[newUntil] [datetimeoffset](7) NULL,
	[discountId] [int] NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[productvariants]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[productvariants](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[productId] [int] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[sku] [nvarchar](255) NOT NULL,
	[price] [decimal](10, 2) NOT NULL,
	[stock] [int] NOT NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[profiles]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[profiles](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[firstName] [nvarchar](255) NOT NULL,
	[lastName] [nvarchar](255) NOT NULL,
	[phone] [nvarchar](255) NOT NULL,
	[isCompany] [bit] NOT NULL,
	[dni] [nvarchar](255) NULL,
	[cuit] [nvarchar](255) NULL,
	[companyName] [nvarchar](255) NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
	[userId] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[store_infos]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[store_infos](
	[id] [int] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[description] [nvarchar](max) NULL,
	[address] [nvarchar](max) NULL,
	[phone] [nvarchar](255) NULL,
	[email] [nvarchar](255) NULL,
	[whatsapp] [nvarchar](255) NULL,
	[logo] [nvarchar](255) NULL,
	[hours] [nvarchar](max) NULL,
	[facebook] [nvarchar](255) NULL,
	[instagram] [nvarchar](255) NULL,
	[twitter] [nvarchar](255) NULL,
	[linkedin] [nvarchar](255) NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[users]    Script Date: 9/25/2026 3:34:03 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[password] [nvarchar](255) NOT NULL,
	[role] [nvarchar](255) NOT NULL,
	[createdAt] [datetimeoffset](7) NOT NULL,
	[updatedAt] [datetimeoffset](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[categories] ON 
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (1, N'Equipos', N'Sección de equipos para laboratorio', N'equipos', 1, 1, NULL, CAST(N'2026-09-25T17:45:17.0800000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:59:32.5370000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (2, N'Agitadores y mezcladores', N'Los agitadores y mezcladores de laboratorio se utilizan para mezclar, agitar o preparar líquidos o muestras líquidas de laboratorio', N'agitadores-y-mezcladores', 1, 1, 1, CAST(N'2026-09-25T17:46:43.0720000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:46:43.0720000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (3, N'Microscopios', N'Microscopios para distintos casos de uso', N'microscopios', 1, 2, 1, CAST(N'2026-09-25T17:47:20.0450000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:47:20.0450000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (4, N'Manejo de líquidos', N'Acá vas a encontrar todo lo necesario para el manejo eficiente de líquidos en laboratorios, desde pipetas hasta dispensadores y buretas', N'manejo-de-liquidos', 1, 2, NULL, CAST(N'2026-09-25T17:48:42.2340000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:48:42.2340000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (5, N'Micropipetas', N'Una micropipeta es un dispositivo de laboratorio empleado para absorber y transferir pequeños volúmenes de líquidos, y permitir su manejo en las distintas técnicas de laboratorio', N'micropipetas', 1, 1, 4, CAST(N'2026-09-25T17:49:28.8930000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:49:28.8930000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (6, N'Buretas', N'La bureta digital permite realizar la determinación cuantitativa de una sustancia o de un grupo de sustancias químicas con el uso de métodos volumétricos', N'buretas', 1, 2, 4, CAST(N'2026-09-25T17:49:57.5710000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:49:57.5710000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (7, N'Consumibles', N'Explora nuestra extensa selección de consumibles para laboratorios', N'consumibles', 1, 3, NULL, CAST(N'2026-09-25T17:50:32.4390000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:50:32.4390000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (8, N'Descartables', N'Suministros desechables para laboratorio. Incluyen desde guantes y batas hasta pipetas y platos de Petri.', N'descartables', 1, 1, 7, CAST(N'2026-09-25T17:51:58.8200000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:51:58.8200000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[categories] ([id], [name], [description], [slug], [isEnabled], [sortOrder], [parentId], [createdAt], [updatedAt]) VALUES (9, N'Ciencias de la vida', N'Desde tubos de PCR hasta placas de cultivo celular y puntas de pipeta.', N'ciencias-de-la-vida', 1, 2, 7, CAST(N'2026-09-25T17:52:42.4870000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:52:42.4870000+00:00' AS DateTimeOffset))
GO
SET IDENTITY_INSERT [dbo].[categories] OFF
GO
SET IDENTITY_INSERT [dbo].[discounts] ON 
GO
INSERT [dbo].[discounts] ([id], [name], [type], [value], [isEnabled], [validFrom], [validTo], [createdAt], [updatedAt]) VALUES (1, N'CyberMonday', N'percent', CAST(15.00 AS Decimal(10, 2)), 1, CAST(N'2026-01-01T00:00:00.0000000+00:00' AS DateTimeOffset), CAST(N'2026-12-31T23:59:59.0000000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T18:11:02.1840000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T18:14:09.7540000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[discounts] ([id], [name], [type], [value], [isEnabled], [validFrom], [validTo], [createdAt], [updatedAt]) VALUES (2, N'- $10 OFF', N'amount', CAST(10.00 AS Decimal(10, 2)), 1, CAST(N'2026-01-01T00:00:00.0000000+00:00' AS DateTimeOffset), CAST(N'2026-12-31T23:59:59.0000000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T18:11:50.5860000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T18:11:50.5860000+00:00' AS DateTimeOffset))
GO
SET IDENTITY_INSERT [dbo].[discounts] OFF
GO
SET IDENTITY_INSERT [dbo].[inquiries] ON 
GO
INSERT [dbo].[inquiries] ([id], [name], [email], [phone], [subject], [message], [source], [productId], [productName], [productSku], [variantId], [variantName], [variantSku], [status], [notified], [readAt], [repliedAt], [createdAt], [updatedAt]) VALUES (1, N'Laura Gomez', N'laura.gomez@gmail.com', N'011-5555-4444', N'Consulta sobre stock', N'Hola, tienen disponible micropipetas de 100 microlitros?', N'contact', NULL, NULL, NULL, NULL, NULL, NULL, N'read', 1, CAST(N'2026-09-25T18:28:55.3660000+00:00' AS DateTimeOffset), NULL, CAST(N'2026-09-25T18:25:23.5580000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T18:28:55.3670000+00:00' AS DateTimeOffset))
GO
SET IDENTITY_INSERT [dbo].[inquiries] OFF
GO
SET IDENTITY_INSERT [dbo].[profiles] ON 
GO
INSERT [dbo].[profiles] ([id], [firstName], [lastName], [phone], [isCompany], [dni], [cuit], [companyName], [createdAt], [updatedAt], [userId]) VALUES (1, N'Dario', N'Javier', N'1133557788', 0, N'35888999', NULL, NULL, CAST(N'2026-09-25T15:15:59.3000000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T15:27:24.8650000+00:00' AS DateTimeOffset), 1)
GO
INSERT [dbo].[profiles] ([id], [firstName], [lastName], [phone], [isCompany], [dni], [cuit], [companyName], [createdAt], [updatedAt], [userId]) VALUES (2, N'Juan', N'Pérez', N'1122112211', 0, N'30303030', NULL, NULL, CAST(N'2026-09-25T17:17:50.1990000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T17:18:13.8070000+00:00' AS DateTimeOffset), 2)
GO
SET IDENTITY_INSERT [dbo].[profiles] OFF
GO
INSERT [dbo].[store_infos] ([id], [name], [description], [address], [phone], [email], [whatsapp], [logo], [hours], [facebook], [instagram], [twitter], [linkedin], [createdAt], [updatedAt]) VALUES (1, N'UALab', N'Sitio de insumos de laboratorio. Grupo 10. Aplicaciones Interactivas', N'Lima 757, Ciudad Autónoma de Buenos Aires', N'0800-122-8233', N'contacto@uade.edu.ar', N'+54 9 11 7662-5199', N'/uploads/logo-1790360595130-789449642.png', N'Lunes a Viernes de 9:00 a 20:00', N'https://www.facebook.com/UADEOficial', N'https://www.instagram.com/uadeoficial', N'https://x.com/UADEoficial', N'https://www.linkedin.com/school/uade/', CAST(N'2026-09-25T18:22:19.5120000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T18:23:15.1570000+00:00' AS DateTimeOffset))
GO
SET IDENTITY_INSERT [dbo].[users] ON 
GO
INSERT [dbo].[users] ([id], [email], [password], [role], [createdAt], [updatedAt]) VALUES (1, N'lencinadariojavier@gmail.com', N'$2b$12$DXA.Bp5/bpEV9aSJY/9TJOzFdA0mt5PfAOyVWE/URPmeS79VwTivy', N'admin', CAST(N'2026-09-25T12:48:25.3380000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T14:00:33.2220000+00:00' AS DateTimeOffset))
GO
INSERT [dbo].[users] ([id], [email], [password], [role], [createdAt], [updatedAt]) VALUES (2, N'juanperez@gmail.com', N'$2b$12$hBUk5ThKZpCDLMBmp6GByekr/dENIzEeBq7Xi/h7Gq6ayeGEOiCRy', N'user', CAST(N'2026-09-25T14:05:14.1630000+00:00' AS DateTimeOffset), CAST(N'2026-09-25T14:42:59.2760000+00:00' AS DateTimeOffset))
GO
SET IDENTITY_INSERT [dbo].[users] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__categori__32DD1E4C7E15AEBA]    Script Date: 9/25/2026 3:34:04 PM ******/
ALTER TABLE [dbo].[categories] ADD UNIQUE NONCLUSTERED 
(
	[slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [product_categories_categoryId_productId_unique]    Script Date: 9/25/2026 3:34:04 PM ******/
ALTER TABLE [dbo].[product_categories] ADD  CONSTRAINT [product_categories_categoryId_productId_unique] UNIQUE NONCLUSTERED 
(
	[productId] ASC,
	[categoryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__products__DDDF4BE7622AE990]    Script Date: 9/25/2026 3:34:04 PM ******/
ALTER TABLE [dbo].[products] ADD UNIQUE NONCLUSTERED 
(
	[sku] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__productv__DDDF4BE7CA7C5492]    Script Date: 9/25/2026 3:34:04 PM ******/
ALTER TABLE [dbo].[productvariants] ADD UNIQUE NONCLUSTERED 
(
	[sku] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__users__AB6E61646EDAF7A0]    Script Date: 9/25/2026 3:34:04 PM ******/
ALTER TABLE [dbo].[users] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT ((1)) FOR [isEnabled]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT ((0)) FOR [sortOrder]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT (NULL) FOR [parentId]
GO
ALTER TABLE [dbo].[discounts] ADD  DEFAULT ((1)) FOR [isEnabled]
GO
ALTER TABLE [dbo].[discounts] ADD  DEFAULT (NULL) FOR [validFrom]
GO
ALTER TABLE [dbo].[discounts] ADD  DEFAULT (NULL) FOR [validTo]
GO
ALTER TABLE [dbo].[inquiries] ADD  DEFAULT (N'contact') FOR [source]
GO
ALTER TABLE [dbo].[inquiries] ADD  DEFAULT (NULL) FOR [productId]
GO
ALTER TABLE [dbo].[inquiries] ADD  DEFAULT (NULL) FOR [variantId]
GO
ALTER TABLE [dbo].[inquiries] ADD  DEFAULT (N'pending') FOR [status]
GO
ALTER TABLE [dbo].[inquiries] ADD  DEFAULT ((0)) FOR [notified]
GO
ALTER TABLE [dbo].[inquiries] ADD  DEFAULT (NULL) FOR [readAt]
GO
ALTER TABLE [dbo].[inquiries] ADD  DEFAULT (NULL) FOR [repliedAt]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT (N'[]') FOR [images]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT ((1)) FOR [isEnabled]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT ((0)) FOR [isFeatured]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT (NULL) FOR [newUntil]
GO
ALTER TABLE [dbo].[products] ADD  DEFAULT (NULL) FOR [discountId]
GO
ALTER TABLE [dbo].[profiles] ADD  DEFAULT ((0)) FOR [isCompany]
GO
ALTER TABLE [dbo].[store_infos] ADD  DEFAULT ((1)) FOR [id]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (N'user') FOR [role]
GO
ALTER TABLE [dbo].[categories]  WITH CHECK ADD FOREIGN KEY([parentId])
REFERENCES [dbo].[categories] ([id])
GO
ALTER TABLE [dbo].[product_categories]  WITH CHECK ADD FOREIGN KEY([categoryId])
REFERENCES [dbo].[categories] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[product_categories]  WITH CHECK ADD FOREIGN KEY([productId])
REFERENCES [dbo].[products] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[products]  WITH CHECK ADD FOREIGN KEY([discountId])
REFERENCES [dbo].[discounts] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[productvariants]  WITH CHECK ADD FOREIGN KEY([productId])
REFERENCES [dbo].[products] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[profiles]  WITH CHECK ADD FOREIGN KEY([userId])
REFERENCES [dbo].[users] ([id])
ON DELETE SET NULL
GO
